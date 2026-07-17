from django.db import models
from django.contrib.auth import get_user_model
from products.models import ProductVariant

User = get_user_model()

class Cart(models.Model):
  user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart')
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)

  def __str__(self):
    return f"Cart for {self.user.email}"


class CartItem(models.Model):
  cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
  variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE)
  quantity = models.PositiveIntegerField(default=1)
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)

  class Meta:
    unique_together = ('cart', 'variant')

  def __str__(self):
    return f"{self.quantity} x {self.variant.product.name} ({self.variant.name}) in {self.cart.user.email}'s Cart"
