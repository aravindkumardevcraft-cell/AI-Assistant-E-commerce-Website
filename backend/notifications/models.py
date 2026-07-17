from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Notification(models.Model):
  NOTIFICATION_TYPES = (
    ('ORDER_STATUS', 'Order Update'),
    ('OTP', 'Authentication Code'),
    ('LOYALTY', 'Loyalty Program'),
    ('SYSTEM', 'System Alert'),
  )

  user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
  title = models.CharField(max_length=150)
  message = models.TextField()
  notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES, default='ORDER_STATUS')
  is_read = models.BooleanField(default=False)
  created_at = models.DateTimeField(auto_now_add=True)

  def __str__(self):
    return f"Notification for {self.user.email}: {self.title} (Read: {self.is_read})"
