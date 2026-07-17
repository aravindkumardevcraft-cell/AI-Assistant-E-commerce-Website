from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from .models import Category, Product, ProductVariant
from .serializers import CategorySerializer, ProductSerializer, ProductVariantSerializer

class CategoryViewSet(viewsets.ModelViewSet):
  queryset = Category.objects.all()
  serializer_class = CategorySerializer

  def get_permissions(self):
    if self.request.method in permissions.SAFE_METHODS:
      return [permissions.AllowAny()]
    return [permissions.IsAdminUser()]


class ProductViewSet(viewsets.ModelViewSet):
  serializer_class = ProductSerializer

  def get_permissions(self):
    if self.request.method in permissions.SAFE_METHODS:
      return [permissions.AllowAny()]
    return [permissions.IsAdminUser()]

  def get_queryset(self):
    # Staff users see all products (active and inactive)
    if self.request.user.is_authenticated and self.request.user.is_staff:
      queryset = Product.objects.all()
    else:
      queryset = Product.objects.filter(is_active=True)

    # Filtering by category
    category_id = self.request.query_params.get('category')
    if category_id:
      queryset = queryset.filter(category_id=category_id)

    # Filtering by category slug
    category_slug = self.request.query_params.get('category_slug')
    if category_slug:
      queryset = queryset.filter(category__slug=category_slug)

    # Filtering by brand
    brand = self.request.query_params.get('brand')
    if brand:
      queryset = queryset.filter(brand__iexact=brand)

    # Text search
    search = self.request.query_params.get('search')
    if search:
      queryset = queryset.filter(
        models.Q(name__icontains=search) |
        models.Q(brand__icontains=search) |
        models.Q(description__icontains=search)
      )

    return queryset.order_by('-created_at')

  # Custom action to toggle product activity
  @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
  def toggle_active(self, request, pk=None):
    product = self.get_object()
    product.is_active = not product.is_active
    product.save()
    return Response({
      'status': 'success',
      'is_active': product.is_active,
      'detail': f"Product '{product.name}' active status set to {product.is_active}"
    })


class ProductVariantViewSet(viewsets.ModelViewSet):
  queryset = ProductVariant.objects.all()
  serializer_class = ProductVariantSerializer

  def get_permissions(self):
    if self.request.method in permissions.SAFE_METHODS:
      return [permissions.AllowAny()]
    return [permissions.IsAdminUser()]

  def create(self, request, *args, **kwargs):
    # Overriding create to auto-link product
    product_id = request.data.get('product_id')
    if not product_id:
      return Response({'detail': 'product_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
      product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
      return Response({'detail': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = self.get_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    variant = serializer.save(product=product)

    # Crucial: Initialize empty InventoryRecord for new variant
    from inventory.models import InventoryRecord
    InventoryRecord.objects.create(variant=variant, current_stock=0)

    headers = self.get_success_headers(serializer.data)
    return Response(ProductVariantSerializer(variant).data, status=status.HTTP_201_CREATED, headers=headers)
