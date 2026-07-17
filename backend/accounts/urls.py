from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SignupRequestView, SignupVerifyView, SignupResendOTPView,
    CustomerLoginView, AdminLoginView, AddressViewSet, AdminCustomerListView
)

router = DefaultRouter()
router.register(r'addresses', AddressViewSet, basename='address')

urlpatterns = [
    path('signup/', SignupRequestView.as_view(), name='signup_request'),
    path('signup/verify/', SignupVerifyView.as_view(), name='signup_verify'),
    path('signup/resend/', SignupResendOTPView.as_view(), name='signup_resend'),
    path('login/', CustomerLoginView.as_view(), name='customer_login'),
    path('admin/login/', AdminLoginView.as_view(), name='admin_login'),
    path('admin/customers/', AdminCustomerListView.as_view(), name='admin_customers'),
    path('', include(router.urls)),
]
