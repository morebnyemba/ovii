"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-20
Description: Defines custom permissions for the wallets app, based on user verification levels.
"""

from rest_framework.permissions import BasePermission
from users.models import VerificationLevels


class IsVerifiedBase(BasePermission):
    """
    Abstract base permission class to check for a minimum verification level.

    Subclasses must set the `required_level` and `message` attributes. This
    approach keeps the permission logic DRY (Don't Repeat Yourself).
    """

    required_level = VerificationLevels.LEVEL_0
    message = "Your account verification level is not sufficient for this action."

    def has_permission(self, request, view):
        """
        Checks if the user has the required verification level.
        This permission should be used alongside IsAuthenticated.
        """
        # IsAuthenticated ensures request.user is a valid user instance.
        return request.user.verification_level >= self.required_level


class IsMobileVerifiedOrHigher(IsVerifiedBase):
    """
    Allows access only to users with at least Mobile Verification (Level 1).
    This is the minimum level required for basic transactions. This class
    replaces the old `CanPerformTransactions` with a more descriptive name.
    """

    required_level = VerificationLevels.LEVEL_1
    message = "Your account must be mobile-verified to perform this action. Please complete your profile."


class IsIdentityVerifiedOrHigher(IsVerifiedBase):
    """
    Allows access only to users with at least Identity Verification (Level 2).
    This can be used for higher-value transactions or more sensitive features.
    """

    required_level = VerificationLevels.LEVEL_2
    message = "Your identity must be verified for this action. Please upload your ID document."


class IsFullyVerified(IsVerifiedBase):
    """
    Allows access only to users who have completed full KYC, including
    address verification (Level 3), which is the highest level.
    """

    required_level = VerificationLevels.LEVEL_3
    message = "Full verification (including address) is required for this action. Please upload your proof of address."
