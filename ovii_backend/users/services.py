"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-20
Description: Defines service-layer functions for the users app.
"""

import logging
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from django.conf import settings

from .models import Referral, OviiUser


logger = logging.getLogger(__name__)


class ReferralBonusError(Exception):
    """Custom exception for referral bonus failures."""
    pass


def credit_referral_bonuses(referral_id: int) -> Referral:
    """
    Credits referral bonuses to both the referrer and the referred user.
    
    This function:
    1. Validates the referral is pending
    2. Checks both users have active wallets
    3. Credits bonuses atomically
    4. Updates the referral status to CREDITED
    
    Args:
        referral_id: The ID of the Referral to process.
        
    Returns:
        The updated Referral instance.
        
    Raises:
        ReferralBonusError: If the bonus cannot be credited.
    """
    # Import here to avoid circular import
    from wallets.models import Wallet, Transaction
    
    with transaction.atomic():
        try:
            referral = Referral.objects.select_for_update().get(id=referral_id)
        except Referral.DoesNotExist:
            raise ReferralBonusError(f"Referral with ID {referral_id} not found.")
        
        # Check if already processed
        if referral.bonus_status == Referral.BonusStatus.CREDITED:
            logger.warning(f"Referral {referral_id} has already been credited.")
            return referral
        
        if referral.bonus_status == Referral.BonusStatus.EXPIRED:
            raise ReferralBonusError(f"Referral {referral_id} has expired and cannot be credited.")
        
        # Get wallets for both users
        try:
            referrer_wallet = Wallet.objects.select_for_update().get(user=referral.referrer)
        except Wallet.DoesNotExist:
            raise ReferralBonusError(f"Referrer (user ID {referral.referrer.id}) does not have a wallet.")
        
        try:
            referred_wallet = Wallet.objects.select_for_update().get(user=referral.referred)
        except Wallet.DoesNotExist:
            raise ReferralBonusError(f"Referred user (user ID {referral.referred.id}) does not have a wallet.")
        
        # Credit bonuses
        if referral.referrer_bonus > Decimal("0.00"):
            referrer_wallet.balance += referral.referrer_bonus
            referrer_wallet.save(update_fields=["balance", "updated_at"])
            
            # Create a transaction record for the referrer bonus
            Transaction.objects.create(
                wallet=referrer_wallet,
                transaction_type=Transaction.TransactionType.COMMISSION,
                amount=referral.referrer_bonus,
                description=f"Referral bonus for referring {referral.referred.first_name} {referral.referred.last_name}",
                status=Transaction.Status.COMPLETED,
            )
            logger.info(f"Credited ${referral.referrer_bonus} referral bonus to user {referral.referrer.id}")
        
        if referral.referred_bonus > Decimal("0.00"):
            referred_wallet.balance += referral.referred_bonus
            referred_wallet.save(update_fields=["balance", "updated_at"])
            
            # Create a transaction record for the referred user bonus
            Transaction.objects.create(
                wallet=referred_wallet,
                transaction_type=Transaction.TransactionType.COMMISSION,
                amount=referral.referred_bonus,
                description=f"Welcome bonus for joining via referral from {referral.referrer.first_name} {referral.referrer.last_name}",
                status=Transaction.Status.COMPLETED,
            )
            logger.info(f"Credited ${referral.referred_bonus} welcome bonus to user {referral.referred.id}")
        
        # Update referral status
        referral.bonus_status = Referral.BonusStatus.CREDITED
        referral.credited_at = timezone.now()
        referral.save(update_fields=["bonus_status", "credited_at"])
        
        logger.info(f"Referral {referral_id} bonuses credited successfully.")
        return referral


def get_referral_bonus_amounts() -> dict:
    """
    Returns the configured referral bonus amounts.
    These can be configured in Django settings or defaults are used.
    
    Returns:
        A dict with 'referrer_bonus' and 'referred_bonus' amounts.
    """
    return {
        "referrer_bonus": getattr(settings, "REFERRAL_BONUS_REFERRER", Decimal("5.00")),
        "referred_bonus": getattr(settings, "REFERRAL_BONUS_REFERRED", Decimal("2.00")),
    }


def check_referral_eligibility(referred_user: OviiUser) -> bool:
    """
    Checks if a referred user is eligible for referral bonus credit.
    
    Eligibility criteria:
    1. User must be active
    2. User must have completed at least one transaction (or set up their PIN)
    
    Args:
        referred_user: The OviiUser who was referred.
        
    Returns:
        True if eligible, False otherwise.
    """
    # User must be active
    if not referred_user.is_active:
        return False
    
    # User must have set up their PIN (indicates they've completed onboarding)
    if not referred_user.has_set_pin:
        return False
    
    return True
