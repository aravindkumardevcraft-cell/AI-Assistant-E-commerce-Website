from django.db import transaction
from .models import LoyaltyAccount, LoyaltyTransaction

class LoyaltyService:
  @staticmethod
  def validate_and_calculate_discount(user, points):
    # Enforce the approved loyalty redemption thresholds
    allowed_points = [500, 1000, 2000]
    if points not in allowed_points:
      raise ValueError("Invalid loyalty points amount. You can redeem 500, 1000, or 2000 points.")

    account, _ = LoyaltyAccount.objects.get_or_create(user=user)
    if account.balance < points:
      raise ValueError(f"Insufficient loyalty points balance. Current balance is {account.balance} points.")

    if points == 500:
      return 25.00
    elif points == 1000:
      return 60.00
    elif points == 2000:
      return 150.00
    return 0.00

  @staticmethod
  def redeem_points(user, points, order):
    with transaction.atomic():
      account, _ = LoyaltyAccount.objects.select_for_update().get_or_create(user=user)
      if account.balance < points:
        raise ValueError("Insufficient points balance.")

      account.balance -= points
      account.save()

      # Log transaction
      LoyaltyTransaction.objects.create(
        account=account,
        points=-points,
        transaction_type='REDEMPTION',
        order_id=order.id,
        notes=f"Redeemed points for order #{order.id} discount"
      )

  @staticmethod
  def award_points(order):
    # ₹10 spent = 1 point
    points_earned = int(order.total_amount / 10)
    if points_earned <= 0:
      return

    with transaction.atomic():
      account, _ = LoyaltyAccount.objects.select_for_update().get_or_create(user=order.user)
      account.balance += points_earned
      account.lifetime_points += points_earned
      account.save()

      # Update tier status dynamically
      account.update_tier()

      # Log transaction
      LoyaltyTransaction.objects.create(
        account=account,
        points=points_earned,
        transaction_type='EARN',
        order_id=order.id,
        notes=f"Points earned from delivery of order #{order.id}"
      )

  @staticmethod
  def refund_points(order):
    # If a cancelled order had points redeemed, return them to the customer balance
    redemptions = LoyaltyTransaction.objects.filter(
      order_id=order.id,
      transaction_type='REDEMPTION'
    )
    if not redemptions.exists():
      return

    with transaction.atomic():
      account, _ = LoyaltyAccount.objects.select_for_update().get_or_create(user=order.user)
      for tx in redemptions:
        points_to_refund = abs(tx.points)
        account.balance += points_to_refund
        account.save()

        # Log return transaction
        LoyaltyTransaction.objects.create(
          account=account,
          points=points_to_refund,
          transaction_type='REFUND',
          order_id=order.id,
          notes=f"Points refunded due to cancellation of order #{order.id}"
        )
