"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: Defines serializers for the agents app.
"""

from rest_framework import serializers
from .models import Agent


class AgentProfileSerializer(serializers.ModelSerializer):
    """Serializer to display an agent's profile details."""

    class Meta:
        model = Agent
        fields = ["agent_code", "is_approved", "created_at"]
