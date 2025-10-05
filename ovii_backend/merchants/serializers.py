"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: Defines serializers for the merchants app.
"""
from rest_framework import serializers
from .models import Merchant


class MerchantProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for a merchant to view their own profile and integration details.
    The API key is read-only and exposed here for the merchant to copy.
    """
    class Meta:
        model = Merchant
        fields = ['business_name', 'api_key', 'webhook_url', 'return_url', 'is_active', 'is_approved']
        read_only_fields = ['business_name', 'api_key', 'is_approved']


class MerchantProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for a merchant to update their integration settings.
    """
    class Meta:
        model = Merchant
        # Merchants can only update these specific fields.
        fields = ['webhook_url', 'return_url', 'is_active']