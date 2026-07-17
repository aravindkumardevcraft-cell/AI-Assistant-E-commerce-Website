from rest_framework import serializers
from .models import LoyaltyAccount, LoyaltyTransaction

class LoyaltyTransactionSerializer(serializers.ModelSerializer):
  class Meta:
    model = LoyaltyTransaction
    fields = ['id', 'points', 'transaction_type', 'order_id', 'notes', 'created_at']


class LoyaltyAccountSerializer(serializers.ModelSerializer):
  transactions = LoyaltyTransactionSerializer(many=True, read_only=True)
  tier_name = serializers.ReadOnlyField(source='get_tier_display')

  class Meta:
    model = LoyaltyAccount
    fields = ['id', 'balance', 'lifetime_points', 'tier', 'tier_name', 'transactions', 'created_at', 'updated_at']
