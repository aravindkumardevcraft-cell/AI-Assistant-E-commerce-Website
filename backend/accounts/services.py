import random
import datetime
from django.conf import settings
from django.utils import timezone
from django.core.mail import send_mail
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, OTPCode

class EmailOTPAdapter:
  @staticmethod
  def send_otp(email, code):
    provider = getattr(settings, 'OTP_EMAIL_PROVIDER', 'console')
    
    subject = "Smart Store - Verify Your Email Address"
    message = f"Your verification code is: {code}\n\nThis code will expire in 5 minutes. Enter this code to verify your account."
    
    if provider == 'smtp':
      try:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@smartstore.local')
        send_mail(
          subject,
          message,
          from_email,
          [email],
          fail_silently=False,
        )
        print(f"[SMTP EMAIL DISPATCH] Sent OTP to {email}")
        return True
      except Exception as e:
        print(f"[SMTP EMAIL ERROR] SMTP connection failed: {e}. Falling back to console logging.")
        provider = 'console'
        
    if provider == 'console':
      print("\n" + "="*60)
      print(f" [DEVELOPMENT OTP GATEWAY] Code for '{email}' is: {code}")
      print(f" Expires at: {timezone.now() + datetime.timedelta(minutes=5)}")
      print("="*60 + "\n")
      return True


class AuthenticationService:
  @staticmethod
  def signup_request(name, email, password):
    # 1. Check if email is already registered and verified
    try:
      existing_user = User.objects.get(email=email)
      if existing_user.is_active:
        raise ValueError("This email address is already registered.")
      
      # If inactive (unverified), allow overwriting password and name
      user = existing_user
      user.set_password(password)
      names = name.strip().split(' ', 1)
      user.first_name = names[0]
      user.last_name = names[1] if len(names) > 1 else ''
      user.save()
    except User.DoesNotExist:
      # Create inactive account
      names = name.strip().split(' ', 1)
      first_name = names[0]
      last_name = names[1] if len(names) > 1 else ''
      user = User.objects.create_user(
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        is_active=False # Inactive until OTP verified
      )

    # 2. Generate 6-digit random code
    code = f"{random.randint(100000, 999999)}"
    expires_at = timezone.now() + datetime.timedelta(minutes=5)
    
    # Write OTP to database
    OTPCode.objects.create(
      identifier=email,
      code=code,
      expires_at=expires_at
    )
    
    # 3. Dispatch OTP
    EmailOTPAdapter.send_otp(email, code)
    return True

  @staticmethod
  def signup_verify(email, code):
    # 1. Fetch latest unused OTP for this email
    otps = OTPCode.objects.filter(
      identifier=email,
      code=code,
      is_used=False
    ).order_by('-created_at')

    if not otps.exists():
      raise ValueError("Invalid verification code.")
      
    otp = otps.first()

    # 2. Check expiry
    if not otp.is_valid():
      raise ValueError("This verification code has expired.")

    # 3. Mark OTP as used
    otp.is_used = True
    otp.save()

    # 4. Activate User
    try:
      user = User.objects.get(email=email)
      user.is_active = True
      user.save()
    except User.DoesNotExist:
      raise ValueError("Customer account record not found.")

    # 5. Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    
    # Initialize loyalty account (Phase G support)
    from loyalty.models import LoyaltyAccount
    LoyaltyAccount.objects.get_or_create(user=user)

    return {
      'token': str(refresh.access_token),
      'email': user.email,
      'name': f"{user.first_name} {user.last_name}".strip(),
      'is_staff': user.is_staff
    }

  @staticmethod
  def customer_login(email, password):
    try:
      user = User.objects.get(email=email)
    except User.DoesNotExist:
      raise ValueError("Invalid email or password.")

    # Check password
    if not user.check_password(password):
      raise ValueError("Invalid email or password.")

    # Verify if verified account
    if not user.is_active:
      raise ValueError("UNVERIFIED_ACCOUNT")

    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    return {
      'token': str(refresh.access_token),
      'email': user.email,
      'name': f"{user.first_name} {user.last_name}".strip(),
      'is_staff': user.is_staff
    }

  @staticmethod
  def admin_login(email, password):
    # Enforces standard email/password check with staff flag
    user = authenticate(username=email, password=password)
    if user is None or not user.is_active:
      raise ValueError("Invalid email or password.")
      
    if not user.is_staff:
      raise ValueError("Unauthorized access. Administrator privileges required.")

    refresh = RefreshToken.for_user(user)
    return {
      'token': str(refresh.access_token),
      'email': user.email,
      'is_staff': user.is_staff
    }
