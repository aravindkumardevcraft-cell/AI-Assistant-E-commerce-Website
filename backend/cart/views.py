from rest_framework import views, permissions, status
from rest_framework.response import Response
from django.db import transaction
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer
from products.models import ProductVariant

class CartBaseView(views.APIView):
  permission_classes = [permissions.IsAuthenticated]

  def get_cart(self, user):
    cart, created = Cart.objects.get_or_create(user=user)
    return cart


class CartView(CartBaseView):
  def get(self, request):
    cart = self.get_cart(request.user)
    serializer = CartSerializer(cart)
    return Response(serializer.data)


class AddToCartView(CartBaseView):
  def post(self, request):
    variant_id = request.data.get('variant_id')
    quantity = int(request.data.get('quantity', 1))

    if not variant_id:
      return Response({'detail': 'variant_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
      variant = ProductVariant.objects.get(id=variant_id)
    except ProductVariant.DoesNotExist:
      return Response({'detail': 'Product variant not found'}, status=status.HTTP_404_NOT_FOUND)

    # Validate stock
    if variant.current_stock < quantity:
      return Response({'detail': f'Requested quantity exceeds available stock ({variant.current_stock})'}, status=status.HTTP_400_BAD_REQUEST)

    cart = self.get_cart(request.user)
    
    with transaction.atomic():
      cart_item, created = CartItem.objects.get_or_create(
        cart=cart,
        variant=variant,
        defaults={'quantity': 0}
      )
      
      # Check stock against combined quantity
      target_qty = cart_item.quantity + quantity
      if variant.current_stock < target_qty:
        return Response({'detail': f'Cannot add item. Combined quantity exceeds available stock.'}, status=status.HTTP_400_BAD_REQUEST)

      cart_item.quantity = target_qty
      cart_item.save()

    return Response(CartItemSerializer(cart_item).data, status=status.HTTP_201_CREATED)


class UpdateCartItemView(CartBaseView):
  def put(self, request):
    variant_id = request.data.get('variant_id')
    quantity = int(request.data.get('quantity', 1))

    if not variant_id:
      return Response({'detail': 'variant_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
      variant = ProductVariant.objects.get(id=variant_id)
    except ProductVariant.DoesNotExist:
      return Response({'detail': 'Product variant not found'}, status=status.HTTP_404_NOT_FOUND)

    # Validate stock
    if variant.current_stock < quantity:
      return Response({'detail': f'Only {variant.current_stock} units available in stock.'}, status=status.HTTP_400_BAD_REQUEST)

    cart = self.get_cart(request.user)
    try:
      cart_item = CartItem.objects.get(cart=cart, variant=variant)
      cart_item.quantity = quantity
      cart_item.save()
      return Response(CartItemSerializer(cart_item).data)
    except CartItem.DoesNotExist:
      return Response({'detail': 'Item not found in cart'}, status=status.HTTP_404_NOT_FOUND)


class RemoveFromCartView(CartBaseView):
  def delete(self, request):
    variant_id = request.data.get('variant_id')
    if not variant_id:
      return Response({'detail': 'variant_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    cart = self.get_cart(request.user)
    try:
      cart_item = CartItem.objects.get(cart=cart, variant_id=variant_id)
      cart_item.delete()
      return Response({'status': 'success', 'detail': 'Item removed from cart'}, status=status.HTTP_200_OK)
    except CartItem.DoesNotExist:
      return Response({'detail': 'Item not found in cart'}, status=status.HTTP_404_NOT_FOUND)


class ClearCartView(CartBaseView):
  def post(self, request):
    cart = self.get_cart(request.user)
    cart.items.all().delete()
    return Response({'status': 'success', 'detail': 'Cart cleared'}, status=status.HTTP_200_OK)


class MergeCartView(CartBaseView):
  def post(self, request):
    items = request.data.get('items', [])
    if not items:
      return Response({'detail': 'items list is required'}, status=status.HTTP_400_BAD_REQUEST)

    cart = self.get_cart(request.user)
    
    with transaction.atomic():
      for item in items:
        variant_id = item.get('variant', {}).get('id') or item.get('variant_id')
        qty = int(item.get('quantity', 1))
        
        if not variant_id:
          continue

        try:
          variant = ProductVariant.objects.get(id=variant_id)
          cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            variant=variant,
            defaults={'quantity': 0}
          )
          
          # Cap quantity at stock limit
          target_qty = cart_item.quantity + qty
          cart_item.quantity = min(target_qty, variant.current_stock)
          cart_item.save()
        except ProductVariant.DoesNotExist:
          pass # Skip invalid variants

    return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)
