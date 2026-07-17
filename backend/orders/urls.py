from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CheckoutView, OrderViewSet, AdminOrderViewSet

router = DefaultRouter()
router.register(r'history', OrderViewSet, basename='orderhistory')
router.register(r'admin-ops', AdminOrderViewSet, basename='adminorderops')

urlpatterns = [
    path('checkout/', CheckoutView.as_view(), name='checkout'),
    path('', include(router.urls)),
]
