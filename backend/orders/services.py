from django.db import transaction
from django.utils import timezone
import datetime
from .models import Order, OrderItem, OrderEvent, IdempotencyKey
from cart.models import Cart
from accounts.models import Address
from inventory.models import InventoryRecord, InventoryTransaction
from loyalty.services import LoyaltyService

class OrderService:
  @staticmethod
  def create_order(user, address_id, idempotency_key, loyalty_points_to_redeem=0):
    # 1. Check Idempotency Key
    try:
      existing_key = IdempotencyKey.objects.get(key=idempotency_key)
      # Return cached response to avoid double checkout
      return existing_key.response_data, True
    except IdempotencyKey.DoesNotExist:
      pass

    # Fetch User's Cart
    try:
      cart = Cart.objects.get(user=user)
    except Cart.DoesNotExist:
      raise ValueError("Shopping cart is empty.")

    if not cart.items.exists():
      raise ValueError("Shopping cart is empty.")

    # Fetch Delivery Address
    try:
      addr = Address.objects.get(id=address_id, user=user)
      addr_snapshot = f"{addr.title}: {addr.street_address}, {addr.city}, {addr.state} - {addr.postal_code}"
      phone_snapshot = addr.phone
    except Address.DoesNotExist:
      raise ValueError("Invalid delivery address selected.")

    # Calculate Totals
    subtotal = sum(item.variant.price * item.quantity for item in cart.items.all())
    discount = 0

    # Process loyalty point redemption
    if loyalty_points_to_redeem > 0:
      discount = LoyaltyService.validate_and_calculate_discount(user, loyalty_points_to_redeem)
    
    total_amount = max(subtotal - discount, 0)

    # 2. Open Atomic SQL Transaction
    with transaction.atomic():
      # Acquire row-level locks on InventoryRecord to prevent race-condition overselling
      items_to_process = []
      for item in cart.items.all():
        record = InventoryRecord.objects.select_for_update().get(variant=item.variant)
        if record.current_stock < item.quantity:
          raise ValueError(f"Insufficient stock for {item.variant.product.name} ({item.variant.name}). Only {record.current_stock} remaining.")
        items_to_process.append((item, record))

      # Create Order
      order = Order.objects.create(
        user=user,
        status='NEW',
        total_amount=total_amount,
        delivery_address=addr_snapshot,
        delivery_phone=phone_snapshot,
        payment_method='COD',
        payment_status='PENDING'
      )

      # Create Order Items & Deduct Inventory
      for item, record in items_to_process:
        # Create Item snapshot
        OrderItem.objects.create(
          order=order,
          variant=item.variant,
          quantity=item.quantity,
          price=item.variant.price
        )

        # Subtract stock
        record.current_stock -= item.quantity
        record.save()

        # Log warehouse transaction
        InventoryTransaction.objects.create(
          inventory_record=record,
          quantity_change=-item.quantity,
          transaction_type='SOLD',
          notes=f"Ordered in Checkout #{order.id}"
        )

      # Deduct points if loyalty points were redeemed
      if loyalty_points_to_redeem > 0:
        LoyaltyService.redeem_points(user, loyalty_points_to_redeem, order)

      # Log event transition
      OrderEvent.objects.create(
        order=order,
        status='NEW',
        notes="Order submitted by customer."
      )

      # Clear cart items
      cart.items.all().delete()

      # Prepare serialization payload for cache
      from .serializers import OrderSerializer
      response_payload = OrderSerializer(order).data

      # Write Idempotency cache key
      expiry = timezone.now() + datetime.timedelta(hours=24) # 24hr expiration
      IdempotencyKey.objects.create(
        key=idempotency_key,
        user=user,
        response_data=response_payload,
        expires_at=expiry
      )

      return response_payload, False

  @staticmethod
  def transition_order_status(order, target_status, user, notes='', eta=''):
    valid_states = [choice[0] for choice in Order.STATUS_CHOICES]
    if target_status not in valid_states:
      raise ValueError("Invalid target order status.")

    current_status = order.status
    if current_status == target_status:
      return order

    # State Machine Validation checks
    allowed_transitions = {
      'NEW': ['ACCEPTED', 'REJECTED', 'CANCELLED'],
      'ACCEPTED': ['PACKING', 'CANCELLED', 'REJECTED'],
      'PACKING': ['READY_FOR_DELIVERY', 'CANCELLED'],
      'READY_FOR_DELIVERY': ['OUT_FOR_DELIVERY', 'CANCELLED'],
      'OUT_FOR_DELIVERY': ['DELIVERED', 'CANCELLED'],
      'DELIVERED': [], # Terminal successful state
      'CANCELLED': [], # Terminal fail states
      'REJECTED': [],
    }

    if target_status not in allowed_transitions.get(current_status, []):
      raise ValueError(f"State transition from '{current_status}' to '{target_status}' is invalid.")

    with transaction.atomic():
      # Refetch order and lock it
      order = Order.objects.select_for_update().get(id=order.id)
      order.status = target_status
      
      if eta:
        order.delivery_eta = eta

      # Handle successful delivery completion
      if target_status == 'DELIVERED':
        order.payment_status = 'PAID'
        # Award loyalty points: 1 point per 10 INR spent
        LoyaltyService.award_points(order)

      # Handle cancellation or rejection: Reverse stock deductions
      elif target_status in ['CANCELLED', 'REJECTED']:
        for item in order.items.all():
          record, created = InventoryRecord.objects.select_for_update().get_or_create(
            variant=item.variant,
            defaults={'current_stock': 0}
          )
          record.current_stock += item.quantity
          record.save()

          # Log inventory correction transaction
          InventoryTransaction.objects.create(
            inventory_record=record,
            quantity_change=item.quantity,
            transaction_type='CORRECTION',
            notes=f"Order #{order.id} {target_status} - stock returned to warehouse"
          )
        
        # Refund points if order was cancelled/rejected
        LoyaltyService.refund_points(order)

      order.save()

      # Log Event
      OrderEvent.objects.create(
        order=order,
        status=target_status,
        notes=notes or f"Order status updated from {current_status} to {target_status}."
      )

      # Send delivery notifications stub (we'll implement this service in Phase H)
      from notifications.services import NotificationService
      NotificationService.send_order_update_notification(order)

    return order
