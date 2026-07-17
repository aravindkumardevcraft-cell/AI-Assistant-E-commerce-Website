from django.urls import path
from .views import (
    CartView, AddToCartView, UpdateCartItemView, 
    RemoveFromCartView, ClearCartView, MergeCartView
)

urlpatterns = [
    path('', CartView.as_view(), name='cart_detail'),
    path('items/', AddToCartView.as_view(), name='cart_add'),
    path('items/update/', UpdateCartItemView.as_view(), name='cart_update'),
    path('items/remove/', RemoveFromCartView.as_view(), name='cart_remove'),
    path('clear/', ClearCartView.as_view(), name='cart_clear'),
    path('merge/', MergeCartView.as_view(), name='cart_merge'),
]
