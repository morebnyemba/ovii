"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-20
Description: Defines custom permissions for the wallets app.
"""

from rest_framework.permissions import BasePermission
from users.models import VerificationLevels


class CanPerformTransactions(BasePermission):
    """
    Custom permission to only allow users with a sufficient KYC level
    to perform transactions.
    """
    message = 'Your account is not verified to perform transactions. Please complete your KYC.'

    def has_permission(self, request, view):
        # Only allow users who have at least completed mobile verification (Level 1)
        # to create transactions.
        return request.user.verification_level >= VerificationLevels.LEVEL_1