"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: Defines serializers for the integrations app.
"""
from rest_framework import serializers
from decimal import Decimal


class PaynowTopUpRequestSerializer(serializers.Serializer):
    """Serializer for a Paynow top-up request."""
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('1.00'))