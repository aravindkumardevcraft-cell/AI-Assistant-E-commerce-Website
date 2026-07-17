from django.urls import path
from .views import LoyaltyAccountView

urlpatterns = [
    path('', LoyaltyAccountView.as_view(), name='loyalty_account'),
]
