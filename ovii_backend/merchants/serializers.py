"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: Defines serializers for the merchants app.
"""

from rest_framework import serializers
from .models import Merchant


class MerchantProfileSerializer(serializers.ModelSerializer):
    """Serializer to display a merchant's profile details."""

    class Meta:
        model = Merchant
        fields = [
            "business_name",
            "api_key",
            "webhook_url",
            "return_url",
            "is_approved",
            "created_at",
        ]
        read_only_fields = ["business_name", "api_key", "is_approved", "created_at"]


class MerchantProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for a merchant to update their integration URLs."""

    class Meta:
        model = Merchant
        fields = ["webhook_url", "return_url"]
