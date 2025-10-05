"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: Defines custom permissions for the agents app.
"""

from rest_framework.permissions import BasePermission
from users.models import OviiUser


class IsApprovedAgent(BasePermission):
    """
    Custom permission to only allow approved agents to access a view.
    """
    message = 'You must be an approved agent to perform this action.'

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated and user.role == OviiUser.Role.AGENT and hasattr(user, 'agent_profile') and user.agent_profile.is_approved
        )