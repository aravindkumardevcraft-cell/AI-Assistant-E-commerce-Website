from rest_framework import serializers
from .models import Cart, CartItem
from products.serializers import ProductVariantSerializer

class CartItemSerializer(serializers.ModelSerializer):
  product_id = serializers.ReadOnlyField(source='variant.product.id')
  product_name = serializers.ReadOnlyField(source='variant.product.name')
  brand = serializers.ReadOnlyField(source='variant.product.brand')
  image_url = serializers.ReadOnlyField(source='variant.product.image_url')
  
  # Flatten variant fields
  variant_id = serializers.PrimaryKeyRelatedField(source='variant', read_only=True)
  variant_name = serializers.ReadOnlyField(source='variant.name')
  price = serializers.ReadOnlyField(source='variant.price')
  stock = serializers.ReadOnlyField(source='variant.current_stock')

  # Details structure to match React context expectation
  product = serializers.SerializerMethodField()
  variant = serializers.SerializerMethodField()

  class Meta:
    model = CartItem
    fields = [
      'id', 'product_id', 'product_name', 'brand', 'image_url',
      'variant_id', 'variant_name', 'price', 'stock', 'quantity',
      'product', 'variant'
    ]

  def get_product(self, obj):
    return {
      'id': obj.variant.product.id,
      'name': obj.variant.product.name,
      'brand': obj.variant.product.brand,
      'image_url': obj.variant.product.image_url,
    }

  def get_variant(self, obj):
    return {
      'id': obj.variant.id,
      'name': obj.variant.name,
      'price': float(obj.variant.price),
      'stock': obj.variant.current_stock,
    }


class CartSerializer(serializers.ModelSerializer):
  items = CartItemSerializer(many=True, read_only=True)
  subtotal = serializers.SerializerMethodField()

  class Meta:
    model = Cart
    fields = ['id', 'items', 'subtotal']

  def get_subtotal(self, obj):
    return sum(item.variant.price * item.quantity for item in obj.items.all())
