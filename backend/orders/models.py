from django.db import models
from django.contrib.auth import get_user_model
from products.models import ProductVariant

User = get_user_model()

class Order(models.Model):
  STATUS_CHOICES = (
    ('NEW', 'Order Placed'),
    ('ACCEPTED', 'Accepted'),
    ('PACKING', 'Packing'),
    ('READY_FOR_DELIVERY', 'Ready for Delivery'),
    ('OUT_FOR_DELIVERY', 'Out for Delivery'),
    ('DELIVERED', 'Delivered'),
    ('CANCELLED', 'Cancelled'),
    ('REJECTED', 'Rejected'),
  )

  PAYMENT_STATUS_CHOICES = (
    ('PENDING', 'Pending Payment'),
    ('PAID', 'Payment Received'),
    ('REFUNDED', 'Payment Refunded'),
  )

  user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
  status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='NEW')
  total_amount = models.DecimalField(max_digits=10, decimal_places=2)
  delivery_address = models.TextField()
  delivery_phone = models.CharField(max_length=15)
  payment_method = models.CharField(max_length=20, default='COD')
  payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='PENDING')
  delivery_eta = models.CharField(max_length=100, blank=True, default='')
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)

  def __str__(self):
    return f"Order #{self.id} for {self.user.email} (Status: {self.status})"


class OrderItem(models.Model):
  order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
  variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT)
  quantity = models.PositiveIntegerField()
  price = models.DecimalField(max_digits=10, decimal_places=2) # Snapshot of variant price at purchase time

  def __str__(self):
    return f"{self.quantity} x {self.variant.product.name} ({self.variant.name}) in Order #{self.order.id}"


class OrderEvent(models.Model):
  order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='events')
  status = models.CharField(max_length=30)
  notes = models.CharField(max_length=255, blank=True)
  created_at = models.DateTimeField(auto_now_add=True)

  def __str__(self):
    return f"Order #{self.order.id} transitioned to {self.status} at {self.created_at}"


class IdempotencyKey(models.Model):
  key = models.CharField(max_length=100, unique=True)
  user = models.ForeignKey(User, on_delete=models.CASCADE)
  response_data = models.JSONField() # Cached serialization of response
  created_at = models.DateTimeField(auto_now_add=True)
  expires_at = models.DateTimeField()

  def __str__(self):
    return f"IdempotencyKey {self.key} for {self.user.email}"
