from rest_framework import serializers
from .models import InventoryRecord, InventoryTransaction

class InventoryRecordSerializer(serializers.ModelSerializer):
  product_name = serializers.ReadOnlyField(source='variant.product.name')
  variant_name = serializers.ReadOnlyField(source='variant.name')
  sku = serializers.ReadOnlyField(source='variant.sku')
  price = serializers.ReadOnlyField(source='variant.price')

  class Meta:
    model = InventoryRecord
    fields = [
      'id', 'variant', 'product_name', 'variant_name', 
      'sku', 'price', 'current_stock', 'low_stock_threshold', 'last_updated'
    ]


class InventoryTransactionSerializer(serializers.ModelSerializer):
  sku = serializers.ReadOnlyField(source='inventory_record.variant.sku')
  variant_name = serializers.ReadOnlyField(source='inventory_record.variant.name')
  product_name = serializers.ReadOnlyField(source='inventory_record.variant.product.name')

  class Meta:
    model = InventoryTransaction
    fields = [
      'id', 'inventory_record', 'sku', 'variant_name', 'product_name',
      'quantity_change', 'transaction_type', 'notes', 'created_at'
    ]
