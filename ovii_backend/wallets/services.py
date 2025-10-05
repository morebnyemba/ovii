"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: Service layer for handling wallet transactions securely.
"""
from decimal import Decimal
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from django.conf import settings

from .models import Wallet, Transaction
from .signals import transaction_completed


class TransactionError(Exception):
    """Custom exception for transaction failures."""
    pass


class TransactionLimitExceededError(Exception):
    """Custom exception raised when a user exceeds their daily transaction limit."""
    pass


def create_transaction(
    sender_wallet: Wallet,
    receiver_wallet: Wallet,
    amount: Decimal,
    transaction_type: str = Transaction.TransactionType.TRANSFER,
    description: str = ""
) -> Transaction:
    """
    Executes a transaction between two wallets securely.

    This function uses a database transaction and row-level locking (`select_for_update`)
    to ensure atomicity and prevent race conditions like double-spending.

    Args:
        sender_wallet: The Wallet instance of the sender.
        receiver_wallet: The Wallet instance of the receiver.
        amount: The Decimal amount to be transferred.
        transaction_type: The type of transaction.
        description: An optional description for the transaction.

    Returns:
        The created Transaction instance.

    Raises:
        TransactionError: If the transaction cannot be completed.
        TransactionLimitExceededError: If the sender exceeds their daily limit.
    """
    if sender_wallet.id == receiver_wallet.id:
        raise TransactionError("Sender and receiver wallets cannot be the same.")

    with transaction.atomic():
        # --- Limit Enforcement ---
        sender_user = sender_wallet.user
        daily_limit = settings.TRANSACTION_LIMITS.get(sender_user.verification_level, Decimal('0.00'))
        
        # Calculate total amount sent by the user in the last 24 hours.
        today_start = timezone.now() - timezone.timedelta(days=1)
        amount_sent_today = sender_wallet.transactions.filter(
            timestamp__gte=today_start,
            status=Transaction.Status.COMPLETED
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        if amount_sent_today + amount > daily_limit:
            raise TransactionLimitExceededError(f"You have exceeded your daily transaction limit of ${daily_limit}.")

        # Lock the wallet rows for the duration of the transaction to prevent race conditions.
        sender_wallet_locked = Wallet.objects.select_for_update().get(pk=sender_wallet.pk)
        receiver_wallet_locked = Wallet.objects.select_for_update().get(pk=receiver_wallet.pk)

        if sender_wallet_locked.balance < amount:
            raise TransactionError("Insufficient funds.")

        sender_wallet_locked.balance -= amount
        receiver_wallet_locked.balance += amount

        sender_wallet_locked.save(update_fields=['balance', 'updated_at'])
        receiver_wallet_locked.save(update_fields=['balance', 'updated_at'])

        new_transaction = Transaction.objects.create(
            wallet=sender_wallet,
            transaction_type=transaction_type,
            amount=amount,
            description=description,
            related_wallet=receiver_wallet,
            status=Transaction.Status.COMPLETED
        )

    # Send a signal after the transaction is successfully committed.
    transaction_completed.send(sender=Transaction, transaction=new_transaction)

    return new_transaction