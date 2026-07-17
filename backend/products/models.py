from django.db import models
from django.utils.text import slugify

class Category(models.Model):
  name = models.CharField(max_length=100, unique=True)
  slug = models.SlugField(max_length=120, unique=True, blank=True)
  description = models.TextField(blank=True)

  class Meta:
    verbose_name_plural = "Categories"

  def save(self, *args, **kwargs):
    if not self.slug:
      self.slug = slugify(self.name)
    super().save(*args, **kwargs)

  def __str__(self):
    return self.name


class Product(models.Model):
  category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
  name = models.CharField(max_length=200)
  brand = models.CharField(max_length=100)
  description = models.TextField(blank=True)
  image_url = models.CharField(max_length=500, blank=True, default='/placeholder-product.png')
  is_active = models.BooleanField(default=True)
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)

  def __str__(self):
    return f"{self.brand} - {self.name}"


class ProductVariant(models.Model):
  product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
  name = models.CharField(max_length=100) # e.g. "500 g", "1 kg", "Pack of 2"
  sku = models.CharField(max_length=50, unique=True)
  price = models.DecimalField(max_digits=10, decimal_places=2)
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)

  @property
  def current_stock(self):
    # Dynamic lookup from inventory app if needed, or simple property helper
    # We will import the InventoryRecord model inside the helper to avoid circular imports
    try:
      return self.inventory_record.current_stock
    except Exception:
      return 0

  def __str__(self):
    return f"{self.product.name} ({self.name}) - ₹{self.price}"
