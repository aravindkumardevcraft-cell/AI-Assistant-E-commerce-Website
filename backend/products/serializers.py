from rest_framework import serializers
from .models import Category, Product, ProductVariant

class CategorySerializer(serializers.ModelSerializer):
  class Meta:
    model = Category
    fields = ['id', 'name', 'slug', 'description']


class ProductVariantSerializer(serializers.ModelSerializer):
  current_stock = serializers.ReadOnlyField()

  class Meta:
    model = ProductVariant
    fields = ['id', 'name', 'sku', 'price', 'current_stock']


class ProductSerializer(serializers.ModelSerializer):
  category_name = serializers.ReadOnlyField(source='category.name')
  variants = ProductVariantSerializer(many=True, read_only=True)

  class Meta:
    model = Product
    fields = [
      'id', 'category', 'category_name', 'name', 'brand', 
      'description', 'image_url', 'is_active', 'variants'
    ]
