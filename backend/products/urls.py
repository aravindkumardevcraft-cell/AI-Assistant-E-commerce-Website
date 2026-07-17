from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ProductViewSet, ProductVariantViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'variants', ProductVariantViewSet, basename='productvariant')
router.register(r'items', ProductViewSet, basename='product') # maps to /api/products/items/ or router structure

urlpatterns = [
    path('', include(router.urls)),
]
