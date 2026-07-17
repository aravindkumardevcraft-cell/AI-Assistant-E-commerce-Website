from django.db import models
from products.models import ProductVariant

class InventoryRecord(models.Model):
  variant = models.OneToOneField(ProductVariant, on_delete=models.CASCADE, related_name='inventory_record')
  current_stock = models.IntegerField(default=0)
  low_stock_threshold = models.IntegerField(default=5)
  last_updated = models.DateTimeField(auto_now=True)

  def __str__(self):
    return f"Inventory for {self.variant.product.name} ({self.variant.name}): {self.current_stock}"


class InventoryTransaction(models.Model):
  TRANSACTION_TYPES = (
    ('RECEIVED', 'Stock Received'),
    ('SOLD', 'Stock Sold'),
    ('CORRECTION', 'Inventory Correction'),
  )

  inventory_record = models.ForeignKey(InventoryRecord, on_delete=models.CASCADE, related_name='transactions')
  quantity_change = models.IntegerField() # e.g. +50 or -5
  transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
  notes = models.CharField(max_length=255, blank=True)
  created_at = models.DateTimeField(auto_now_add=True)

  def __str__(self):
    sign = '+' if self.quantity_change >= 0 else ''
    return f"{self.transaction_type}: {sign}{self.quantity_change} for {self.inventory_record.variant.sku} at {self.created_at}"
