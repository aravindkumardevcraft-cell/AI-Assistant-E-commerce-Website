import random
import datetime
from django.utils import timezone
from rest_framework import views, viewsets, permissions, status
from rest_framework.response import Response
from .services import AuthenticationService, EmailOTPAdapter
from .models import User, Address, OTPCode
from .serializers import AddressSerializer

class SignupRequestView(views.APIView):
  permission_classes = [permissions.AllowAny]

  def post(self, request):
    name = request.data.get('name', '').strip()
    email = request.data.get('email', '').strip()
    password = request.data.get('password', '')
    confirm_password = request.data.get('confirm_password', '')

    if not name:
      return Response({'detail': 'Full name is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if not email or '@' not in email:
      return Response({'detail': 'Please enter a valid email address.'}, status=status.HTTP_400_BAD_REQUEST)
    if not password:
      return Response({'detail': 'Password is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if len(password) < 6:
      return Response({'detail': 'Password must be at least 6 characters long.'}, status=status.HTTP_400_BAD_REQUEST)
    if password != confirm_password:
      return Response({'detail': 'Passwords do not match.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
      AuthenticationService.signup_request(name, email, password)
      return Response({'status': 'success', 'detail': 'Verification code dispatched to your email.'}, status=status.HTTP_200_OK)
    except ValueError as e:
      return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
      return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SignupVerifyView(views.APIView):
  permission_classes = [permissions.AllowAny]

  def post(self, request):
    email = request.data.get('email', '').strip()
    code = request.data.get('code', '').strip()

    if not email or not code:
      return Response({'detail': 'Email and verification code are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
      auth_data = AuthenticationService.signup_verify(email, code)
      return Response(auth_data, status=status.HTTP_200_OK)
    except ValueError as e:
      return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
      return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SignupResendOTPView(views.APIView):
  permission_classes = [permissions.AllowAny]

  def post(self, request):
    email = request.data.get('email', '').strip()
    if not email:
      return Response({'detail': 'Email address is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
      user = User.objects.get(email=email)
      if user.is_active:
        return Response({'detail': 'This account is already active and verified.'}, status=status.HTTP_400_BAD_REQUEST)

      # Generate new OTP
      code = f"{random.randint(100000, 999999)}"
      expires_at = timezone.now() + datetime.timedelta(minutes=5)
      
      OTPCode.objects.create(
        identifier=email,
        code=code,
        expires_at=expires_at
      )

      EmailOTPAdapter.send_otp(email, code)
      return Response({'status': 'success', 'detail': 'A new verification code was sent to your email.'}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
      return Response({'detail': 'Signup context not found. Please register first.'}, status=status.HTTP_404_NOT_FOUND)


class CustomerLoginView(views.APIView):
  permission_classes = [permissions.AllowAny]

  def post(self, request):
    email = request.data.get('email', '').strip()
    password = request.data.get('password', '')

    if not email or not password:
      return Response({'detail': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
      auth_data = AuthenticationService.customer_login(email, password)
      return Response(auth_data, status=status.HTTP_200_OK)
    except ValueError as e:
      err_msg = str(e)
      if err_msg == "UNVERIFIED_ACCOUNT":
        return Response({
          'detail': 'verification_incomplete',
          'email': email,
          'message': 'Your email verification is incomplete. Please enter the OTP code sent to your email address.'
        }, status=status.HTTP_400_BAD_REQUEST)
      return Response({'detail': err_msg}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
      return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminLoginView(views.APIView):
  permission_classes = [permissions.AllowAny]

  def post(self, request):
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
      return Response({'detail': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
      auth_data = AuthenticationService.admin_login(email, password)
      return Response(auth_data, status=status.HTTP_200_OK)
    except ValueError as e:
      return Response({'detail': str(e)}, status=status.HTTP_41_UNAUTHORIZED or status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
      return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AddressViewSet(viewsets.ModelViewSet):
  serializer_class = AddressSerializer
  permission_classes = [permissions.IsAuthenticated]

  def get_queryset(self):
    return Address.objects.filter(user=self.request.user).order_by('-is_default', '-created_at')

  def perform_create(self, serializer):
    serializer.save(user=self.request.user)


class AdminCustomerListView(views.APIView):
  permission_classes = [permissions.IsAdminUser]

  def get(self, request):
    from accounts.models import User
    from loyalty.models import LoyaltyAccount
    
    users = User.objects.filter(is_staff=False).order_by('-date_joined')
    data = []
    for u in users:
      loyalty = LoyaltyAccount.objects.filter(user=u).first()
      balance = loyalty.balance if loyalty else 0
      tier = loyalty.get_tier_display() if loyalty else 'Bronze Tier'
      
      data.append({
        'id': u.id,
        'email': u.email,
        'phone': u.phone or '',
        'name': f"{u.first_name} {u.last_name}".strip() or u.email.split('@')[0],
        'date_joined': u.date_joined.isoformat(),
        'loyalty_balance': balance,
        'loyalty_tier': tier
      })
    return Response(data)
