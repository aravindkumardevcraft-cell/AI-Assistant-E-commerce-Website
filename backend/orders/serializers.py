from rest_framework import serializers
from .models import Order, OrderItem, OrderEvent

class OrderItemSerializer(serializers.ModelSerializer):
  product_name = serializers.ReadOnlyField(source='variant.product.name')
  variant_name = serializers.ReadOnlyField(source='variant.name')
  sku = serializers.ReadOnlyField(source='variant.sku')
  brand = serializers.ReadOnlyField(source='variant.product.brand')

  class Meta:
    model = OrderItem
    fields = ['id', 'product_name', 'variant_name', 'sku', 'brand', 'quantity', 'price']


class OrderEventSerializer(serializers.ModelSerializer):
  class Meta:
    model = OrderEvent
    fields = ['id', 'status', 'notes', 'created_at']


class OrderSerializer(serializers.ModelSerializer):
  items = OrderItemSerializer(many=True, read_only=True)
  events = OrderEventSerializer(many=True, read_only=True)
  customer_email = serializers.ReadOnlyField(source='user.email')
  customer_phone = serializers.ReadOnlyField(source='user.phone')
  customer_name = serializers.SerializerMethodField()

  class Meta:
    model = Order
    fields = [
      'id', 'status', 'total_amount', 'delivery_address', 'delivery_phone',
      'payment_method', 'payment_status', 'delivery_eta', 'created_at', 'updated_at',
      'items', 'events', 'customer_email', 'customer_phone', 'customer_name'
    ]

  def get_customer_name(self, obj):
    first = obj.user.first_name
    last = obj.user.last_name
    if not first and not last:
      return obj.user.email.split('@')[0]
    return f"{first} {last}".strip()
