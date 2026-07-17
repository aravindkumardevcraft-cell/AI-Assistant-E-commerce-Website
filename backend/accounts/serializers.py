from rest_framework import serializers
from .models import Address

class AddressSerializer(serializers.ModelSerializer):
  class Meta:
    model = Address
    fields = [
      'id', 'title', 'street_address', 'city', 
      'state', 'postal_code', 'phone', 'is_default'
    ]
    read_only_fields = ['id']
