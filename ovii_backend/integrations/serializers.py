"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: Defines serializers for the integrations app.
"""

from rest_framework import serializers
from decimal import Decimal
from .models import WhatsAppConfig


class PaynowTopUpRequestSerializer(serializers.Serializer):
    """Serializer for a Paynow top-up request."""

    amount = serializers.DecimalField(
        max_digits=12, decimal_places=2, min_value=Decimal("1.00")
    )


class WhatsAppConfigSerializer(serializers.ModelSerializer):
    """Serializer for WhatsApp configuration."""
    
    class Meta:
        model = WhatsAppConfig
        fields = [
            "id",
            "phone_number_id",
            "access_token",
            "api_version",
            "webhook_verify_token",
            "is_active",
            "created_at",
            "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        extra_kwargs = {
            "access_token": {"write_only": True}  # Don't expose token in GET responses
        }
