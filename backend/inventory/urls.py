from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InventoryRecordViewSet, InventoryTransactionViewSet

router = DefaultRouter()
router.register(r'records', InventoryRecordViewSet, basename='inventoryrecord')
router.register(r'transactions', InventoryTransactionViewSet, basename='inventorytransaction')

urlpatterns = [
    path('', include(router.urls)),
]
