from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class LoyaltyAccount(models.Model):
  TIER_CHOICES = (
    ('BRONZE', 'Bronze Tier'),
    ('SILVER', 'Silver Tier'),
    ('GOLD', 'Gold Tier'),
    ('PLATINUM', 'Platinum Tier'),
  )

  user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='loyalty_account')
  balance = models.PositiveIntegerField(default=0)
  lifetime_points = models.PositiveIntegerField(default=0)
  tier = models.CharField(max_length=20, choices=TIER_CHOICES, default='BRONZE')
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)

  def update_tier(self):
    points = self.lifetime_points
    if points >= 5000:
      self.tier = 'PLATINUM'
    elif points >= 1500:
      self.tier = 'GOLD'
    elif points >= 500:
      self.tier = 'SILVER'
    else:
      self.tier = 'BRONZE'
    self.save()

  def __str__(self):
    return f"{self.user.email} - Balance: {self.balance} ({self.tier})"


class LoyaltyTransaction(models.Model):
  TX_TYPES = (
    ('EARN', 'Points Earned'),
    ('REDEMPTION', 'Points Redeemed'),
    ('REFUND', 'Points Returned'),
  )

  account = models.ForeignKey(LoyaltyAccount, on_delete=models.CASCADE, related_name='transactions')
  points = models.IntegerField() # e.g. +20 or -500
  transaction_type = models.CharField(max_length=20, choices=TX_TYPES)
  order_id = models.IntegerField(null=True, blank=True) # Linked Order snapshot
  notes = models.CharField(max_length=255, blank=True)
  created_at = models.DateTimeField(auto_now_add=True)

  def __str__(self):
    sign = '+' if self.points >= 0 else ''
    return f"{self.transaction_type}: {sign}{self.points} points for {self.account.user.email}"
