"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-20
Description: Defines service-layer functions for the wallets app.
"""

from decimal import Decimal
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from django.conf import settings
from .models import Wallet, Transaction


class InsufficientFundsError(Exception):
    """Custom exception raised when a wallet has insufficient funds."""
    pass

class TransactionLimitExceededError(Exception):
    """Custom exception raised when a user exceeds their daily transaction limit."""
    pass


@transaction.atomic
def perform_wallet_transfer(source_wallet: Wallet, destination_wallet: Wallet, amount: Decimal) -> Transaction:
    """
    Performs a fund transfer between two wallets within a database transaction.

    This function ensures atomicity: the entire operation will be rolled back
    if any part of it fails.

    Args:
        source_wallet: The Wallet instance to debit.
        destination_wallet: The Wallet instance to credit.
        amount: The Decimal amount to transfer.

    Returns:
        The created and completed Transaction object.

    Raises:
        InsufficientFundsError: If the source wallet's balance is less than the amount.
    """
    # --- Limit Enforcement ---
    user = source_wallet.user
    daily_limit = settings.TRANSACTION_LIMITS.get(user.verification_level, Decimal('0.00'))

    # Calculate total amount sent by the user in the last 24 hours.
    today_start = timezone.now() - timezone.timedelta(days=1)
    amount_sent_today = source_wallet.sent_transactions.filter(
        timestamp__gte=today_start,
        status=Transaction.Status.COMPLETED
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

    if amount_sent_today + amount > daily_limit:
        raise TransactionLimitExceededError(f"You have exceeded your daily transaction limit of ${daily_limit}.")

    # Lock the rows for update to prevent race conditions
    source_wallet = Wallet.objects.select_for_update().get(pk=source_wallet.pk)
    destination_wallet = Wallet.objects.select_for_update().get(pk=destination_wallet.pk)

    # --- Balance Check (after locking) ---
    # This check is now safe from race conditions.
    if source_wallet.balance < amount:
        raise InsufficientFundsError("Insufficient funds in the source wallet.")

    # Perform the transfer
    source_wallet.balance -= amount
    destination_wallet.balance += amount

    source_wallet.save(update_fields=['balance', 'updated_at'])
    destination_wallet.save(update_fields=['balance', 'updated_at'])

    # Create the transaction record
    transaction_record = Transaction.objects.create(
        source_wallet=source_wallet,
        destination_wallet=destination_wallet,
        amount=amount,
        status=Transaction.Status.COMPLETED
    )

    return transaction_record