import re
from django.db import models
from products.models import Product, Category
from orders.models import Order
from loyalty.models import LoyaltyAccount
from cart.models import Cart

class ChatOrchestrator:
  @staticmethod
  def process_query(query_text, user=None, context=None):
    query = query_text.lower().strip()
    response = {
      "text": "I didn't quite catch that. Try asking about our products, delivery times, or your orders.",
      "products": [],
      "orders": [],
      "requires_auth": False,
      "intent": "UNKNOWN"
    }

    # Helper: Check auth
    def check_auth():
      if user is None or not user.is_authenticated:
        response["requires_auth"] = True
        response["text"] = "This action requires account verification. Please log in first."
        return False
      return True

    # 1. Protected Intents: ORDER_CANCEL
    if any(k in query for k in ["cancel my order", "cancel order"]):
      if not check_auth():
        response["intent"] = "ORDER_CANCEL"
        return response

      # Look for digit patterns in query
      match = re.search(r'\d+', query)
      if match:
        order_id = int(match.group())
        try:
          order = Order.objects.get(id=order_id, user=user)
          if order.status == 'NEW':
            from orders.services import OrderService
            OrderService.transition_order_status(order, 'CANCELLED', user, notes="Cancelled via AI chatbot.")
            response["text"] = f"Your order #{order.id} has been successfully cancelled."
          else:
            response["text"] = f"Order #{order.id} cannot be cancelled as its status is '{order.get_status_display()}'."
        except Order.DoesNotExist:
          response["text"] = f"I couldn't find any order matching #{order_id} under your account."
      else:
        active_orders = Order.objects.filter(user=user, status='NEW')
        if active_orders.exists():
          ids = ", ".join([f"#{o.id}" for o in active_orders])
          response["text"] = f"You have new orders: {ids}. Please tell me the specific order number to cancel (e.g. 'cancel order {active_orders.first().id}')."
        else:
          response["text"] = "You don't have any pending orders that can be cancelled at this stage."
      
      response["intent"] = "ORDER_CANCEL"
      return response

    # 2. Protected Intents: ORDER_TRACKING / ORDER_HISTORY
    elif any(k in query for k in ["where is my order", "track order", "track my", "order history", "show my recent orders", "recent orders"]):
      if not check_auth():
        response["intent"] = "ORDER_TRACKING"
        return response

      user_orders = Order.objects.filter(user=user).order_by('-created_at')
      if not user_orders.exists():
        response["text"] = "You have not placed any orders yet."
      else:
        # Check if they queried a specific ID
        match = re.search(r'\d+', query)
        if match:
          order_id = int(match.group())
          try:
            order = user_orders.get(id=order_id)
            response["text"] = f"Order #{order.id} status is '{order.get_status_display()}'. Estimated delivery: {order.delivery_eta or '1-2 Days'}."
            response["orders"] = [{
              "id": str(order.id),
              "status": order.get_status_display(),
              "total_amount": float(order.total_amount),
              "delivery_eta": order.delivery_eta or '1-2 Days'
            }]
          except Order.DoesNotExist:
            response["text"] = f"I couldn't find order #{order_id} under your profile."
        else:
          # Return up to 3 recent orders
          recent = user_orders[:3]
          order_list = ", ".join([f"#{o.id} ({o.get_status_display()})" for o in recent])
          response["text"] = f"Here are your recent orders: {order_list}."
          response["orders"] = [{
            "id": str(o.id),
            "status": o.get_status_display(),
            "total_amount": float(o.total_amount),
            "delivery_eta": o.delivery_eta or '1-2 Days'
          } for o in recent]

      response["intent"] = "ORDER_TRACKING"
      return response

    # 3. Protected Intents: LOYALTY_BALANCE / LOYALTY_REWARDS
    elif any(k in query for k in ["loyalty points", "my points", "points balance", "loyalty rewards", "how to redeem", "rewards"]):
      if not check_auth():
        response["intent"] = "LOYALTY_BALANCE"
        return response

      account, _ = LoyaltyAccount.objects.get_or_create(user=user)
      response["text"] = f"Your current loyalty balance is {account.balance} points ({account.get_tier_display()}). Lifetime earned points: {account.lifetime_points}."
      response["intent"] = "LOYALTY_BALANCE"
      return response

    # 4. Protected Intents: CART_INFORMATION / CART_POINTS_ESTIMATE
    elif any(k in query for k in ["what is in my cart", "show my cart", "my cart", "cart points estimate", "points from cart"]):
      if not check_auth():
        response["intent"] = "CART_INFORMATION"
        return response

      try:
        cart = Cart.objects.get(user=user)
        items = cart.items.all()
        if not items.exists():
          response["text"] = "Your cart is currently empty."
        else:
          item_names = ", ".join([f"{item.quantity}x {item.variant.product.name} ({item.variant.name})" for item in items])
          subtotal = sum(item.variant.price * item.quantity for item in items)
          est_points = int(subtotal / 10)
          response["text"] = f"Your cart contains: {item_names}. Subtotal: ₹{subtotal:.2f}. Checkout will earn you approximately {est_points} loyalty points."
      except Cart.DoesNotExist:
        response["text"] = "Your cart is currently empty."

      response["intent"] = "CART_INFORMATION"
      return response

    # 5. Public Intent: GENERAL_DELIVERY_QUERY
    elif any(k in query for k in ["delivery take", "delivery charge", "shipping", "how long does delivery", "delivery options"]):
      response["text"] = "We offer free home delivery on all household and grocery orders. Orders inside city limits are delivered via Cash on Delivery within 1 to 2 days."
      response["intent"] = "GENERAL_DELIVERY_QUERY"
      return response

    # 6. Public Intent: BUDGET_SHOPPING
    elif any(k in query for k in ["under", "below", "less than", "₹"]):
      # Extract number
      match = re.search(r'\d+', query)
      if match:
        budget = float(match.group())
        products = Product.objects.filter(variants__price__lte=budget).distinct()
        if products.exists():
          response["text"] = f"Here are the items I found priced under ₹{budget:.2f}:"
          response["products"] = [p.to_dict() for p in products[:5]]
        else:
          response["text"] = f"I'm sorry, I couldn't find any products priced under ₹{budget:.2f}."
      else:
        response["text"] = "Please specify a numeric price limit, e.g. 'products under 500'."
      
      response["intent"] = "BUDGET_SHOPPING"
      return response

    # 7. Public Intent: PRODUCT_COMPARISON
    elif any(k in query for k in ["compare", "versus", "vs"]):
      response["intent"] = "PRODUCT_COMPARISON"
      # Try matching product names
      all_prods = Product.objects.all()
      found = [p for p in all_prods if p.name.lower() in query]
      if len(found) >= 2:
        p1, p2 = found[0], found[1]
        v1 = p1.variants.first()
        v2 = p2.variants.first()
        price1 = f"₹{v1.price}" if v1 else "N/A"
        price2 = f"₹{v2.price}" if v2 else "N/A"
        response["text"] = f"Comparing {p1.name} and {p2.name}: \n- {p1.name} (Brand: {p1.brand}) starts at {price1}. \n- {p2.name} (Brand: {p2.brand}) starts at {price2}."
      else:
        response["text"] = "Please name two products to compare (e.g. 'compare Surf Excel and Ariel')."
      return response

    # 8. Public Intent: PRODUCT_SUBSTITUTE
    elif any(k in query for k in ["substitute", "alternative"]):
      response["intent"] = "PRODUCT_SUBSTITUTE"
      all_prods = Product.objects.all()
      match = [p for p in all_prods if p.name.lower() in query]
      if match:
        prod = match[0]
        # Find alternatives in the same category
        alts = Product.objects.filter(category=prod.category).exclude(id=prod.id)[:3]
        if alts.exists():
          alt_names = ", ".join([a.name for a in alts])
          response["text"] = f"Alternatives to {prod.name} in the {prod.category.name} category include: {alt_names}."
          response["products"] = [a.to_dict() for a in alts]
        else:
          response["text"] = f"I couldn't find any direct alternatives to {prod.name} in the same category."
      else:
        response["text"] = "Please name a specific product you would like an alternative for."
      return response

    # 9. Public Intent: PRODUCT_AVAILABILITY
    elif any(k in query for k in ["available", "stock", "in stock"]):
      response["intent"] = "PRODUCT_AVAILABILITY"
      all_prods = Product.objects.all()
      match = [p for p in all_prods if p.name.lower() in query]
      if match:
        prod = match[0]
        v = prod.variants.first()
        if v and v.current_stock > 0:
          response["text"] = f"Yes! {prod.name} is in stock ({v.current_stock} units available, priced at ₹{v.price})."
          response["products"] = [prod.to_dict()]
        else:
          response["text"] = f"I'm sorry, {prod.name} is currently out of stock."
          # Log unfulfilled query in MongoDB analytics (Phase K details)
      else:
        response["text"] = "Which product's stock availability would you like to check?"
      return response

    # 10. Default: PRODUCT_SEARCH
    else:
      # General keyword search in products
      search_term = query.replace("do you have", "").replace("search for", "").strip()
      if len(search_term) > 2:
        products = Product.objects.filter(
          models.Q(name__icontains=search_term) | 
          models.Q(brand__icontains=search_term) |
          models.Q(category__name__icontains=search_term)
        ).distinct()

        if products.exists():
          response["text"] = f"Yes, I found these matching items in our catalog:"
          response["products"] = [p.to_dict() for p in products[:3]]
          response["intent"] = "PRODUCT_SEARCH"
          return response
        else:
          # Log unfulfilled query in MongoDB analytics
          from analytics.services import AnalyticsService
          AnalyticsService.log_unfulfilled_search(search_term, user)

          response["text"] = f"I'm sorry, we don't have '{search_term}' in stock right now. I will notify the owner to check demand."
          response["intent"] = "PRODUCT_SEARCH"
          return response

    return response
