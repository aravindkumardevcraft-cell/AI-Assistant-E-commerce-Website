from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone
import datetime

class UserManager(BaseUserManager):
  def create_user(self, email=None, phone=None, password=None, **extra_fields):
    if not email and not phone:
      raise ValueError('Users must have an email or a phone number')

    # If email is missing, generate a virtual email address using the phone number
    if not email:
      email = f'{phone}@phone.store'

    email = self.normalize_email(email)
    user = self.model(email=email, phone=phone, **extra_fields)

    if password:
      user.set_password(password)
    else:
      user.set_unusable_password()

    user.save(using=self._db)
    return user

  def create_superuser(self, email, password=None, **extra_fields):
    extra_fields.setdefault('is_staff', True)
    extra_fields.setdefault('is_superuser', True)
    extra_fields.setdefault('is_active', True)

    if extra_fields.get('is_staff') is not True:
      raise ValueError('Superuser must have is_staff=True.')
    if extra_fields.get('is_superuser') is not True:
      raise ValueError('Superuser must have is_superuser=True.')

    return self.create_user(email=email, password=password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
  email = models.EmailField(unique=True)
  phone = models.CharField(max_length=15, unique=True, null=True, blank=True)
  first_name = models.CharField(max_length=50, blank=True)
  last_name = models.CharField(max_length=50, blank=True)
  is_active = models.BooleanField(default=True)
  is_staff = models.BooleanField(default=False)
  is_superuser = models.BooleanField(default=False)
  date_joined = models.DateTimeField(default=timezone.now)

  objects = UserManager()

  USERNAME_FIELD = 'email'
  REQUIRED_FIELDS = []

  def __str__(self):
    return self.email


class Address(models.Model):
  user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
  title = models.CharField(max_length=50, help_text='e.g., Home, Office', default='Home')
  street_address = models.TextField()
  city = models.CharField(max_length=100)
  state = models.CharField(max_length=100)
  postal_code = models.CharField(max_length=10)
  phone = models.CharField(max_length=15)
  is_default = models.BooleanField(default=False)
  created_at = models.DateTimeField(auto_now_add=True)

  def save(self, *args, **kwargs):
    # Ensure only one address is default for a user
    if self.is_default:
      Address.objects.filter(user=self.user, is_default=True).update(is_default=False)
    super().save(*args, **kwargs)

  def __str__(self):
    return f'{self.title} - {self.street_address}, {self.city}'


class OTPCode(models.Model):
  identifier = models.CharField(max_length=100) # Email or Phone
  code = models.CharField(max_length=6)
  created_at = models.DateTimeField(auto_now_add=True)
  expires_at = models.DateTimeField()
  is_used = models.BooleanField(default=False)

  def is_valid(self):
    return not self.is_used and timezone.now() < self.expires_at

  def __str__(self):
    return f'OTP for {self.identifier} ({self.code})'
