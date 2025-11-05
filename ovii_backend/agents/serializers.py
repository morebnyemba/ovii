"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: Defines serializers for the agents app.
"""

from rest_framework import serializers
from .models import Agent
from wallets.models import Transaction


class AgentProfileSerializer(serializers.ModelSerializer):
    """Serializer to display an agent's profile details."""

    class Meta:
        model = Agent
        fields = [
            "agent_code",
            "business_name",
            "location",
            "commission_rate",
            "is_approved",
            "created_at",
        ]
        read_only_fields = ["agent_code", "is_approved", "created_at"]


class AgentOnboardingSerializer(serializers.ModelSerializer):
    """Serializer for onboarding a new agent."""

    class Meta:
        model = Agent
        fields = ["business_name", "location"]


class CommissionSerializer(serializers.ModelSerializer):
    """Serializer for displaying agent commission history."""

    class Meta:
        model = Transaction
        fields = ["amount", "description", "timestamp"]
