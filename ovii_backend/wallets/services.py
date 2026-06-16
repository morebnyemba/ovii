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

from .models import Wallet, Transaction, TransactionCharge, SystemWallet
from .signals import transaction_completed, compensation_created


class TransactionError(Exception):
    """Custom exception for transaction failures."""

    pass


class TransactionLimitExceededError(Exception):
    """Custom exception raised when a user exceeds their daily transaction limit."""

    pass


def get_transaction_charge(
    transaction_type: str, user_role: str, amount: Decimal
) -> TransactionCharge | None:
    """
    Determines the transaction charge to apply based on the transaction type,
    user role, and amount.
    """
    # This is a placeholder for your business logic to determine the charge.
    # You can have more complex rules here, e.g., based on the user's verification level.
    charge_name = f"{transaction_type.lower()}_{user_role.lower()}"
    try:
        return TransactionCharge.objects.get(name=charge_name, is_active=True)
    except TransactionCharge.DoesNotExist:
        return None


# ...

def create_transaction(
    sender_wallet: Wallet,
    receiver_wallet: Wallet,
    amount: Decimal,
    transaction_type: str = Transaction.TransactionType.TRANSFER,
    description: str = "",
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
        # --- System Wallet for Fee Collection ---
        fee_wallet, _ = SystemWallet.objects.get_or_create(name="Fee Wallet")

        # --- Limit Enforcement ---
        sender_user = sender_wallet.user
        daily_limit = settings.TRANSACTION_LIMITS.get(
            sender_user.verification_level, Decimal("0.00")
        )

        # Calculate total amount sent by the user in the last 24 hours.
        today_start = timezone.now() - timezone.timedelta(days=1)
        amount_sent_today = (
            sender_wallet.transactions.filter(
                timestamp__gte=today_start, status=Transaction.Status.COMPLETED
            ).aggregate(total=Sum("amount"))["total"]
            or Decimal("0.00")
        )

        if amount_sent_today + amount > daily_limit:
            raise TransactionLimitExceededError(
                f"You have exceeded your daily transaction limit of ${daily_limit}."
            )

        # --- Charge Calculation ---
        charge = get_transaction_charge(
            transaction_type, sender_user.role, amount
        )
        charge_amount = charge.calculate_charge(amount) if charge else Decimal("0.00")

        # Lock the wallet rows for the duration of the transaction to prevent race conditions.
        sender_wallet_locked = Wallet.objects.select_for_update().get(
            pk=sender_wallet.pk
        )
        receiver_wallet_locked = Wallet.objects.select_for_update().get(
            pk=receiver_wallet.pk
        )

        if charge and charge.applies_to == TransactionCharge.AppliesTo.SENDER:
            total_deduction = amount + charge_amount
            if sender_wallet_locked.balance < total_deduction:
                raise TransactionError("Insufficient funds to cover transaction and charges.")
            sender_wallet_locked.balance -= total_deduction
            receiver_wallet_locked.balance += amount
        else: # Charge applies to receiver or no charge
            if sender_wallet_locked.balance < amount:
                raise TransactionError("Insufficient funds.")
            sender_wallet_locked.balance -= amount
            receiver_wallet_locked.balance += (amount - charge_amount)

        # Add the charge to the fee wallet
        if charge_amount > 0:
            fee_wallet.balance += charge_amount
            fee_wallet.save(update_fields=["balance"])

        sender_wallet_locked.save(update_fields=["balance", "updated_at"])
        receiver_wallet_locked.save(update_fields=["balance", "updated_at"])

        new_transaction = Transaction.objects.create(
            wallet=sender_wallet,
            transaction_type=transaction_type,
            amount=amount,
            description=description,
            related_wallet=receiver_wallet,
            status=Transaction.Status.COMPLETED,
            charge=charge,
            charge_amount=charge_amount,
        )

    # Send a signal after the transaction is successfully committed.
    transaction_completed.send(sender=Transaction, transaction=new_transaction)

    return new_transaction


def create_compensation_transaction(
    original_transaction: Transaction,
    initiated_by,
    reason: str = "",
) -> Transaction:
    """
    Creates a compensation (reversal) transaction for a completed transaction.

    A compensation does NOT modify the original transaction — it creates a new,
    clearly-labelled COMPENSATION transaction that moves funds in the opposite
    direction to neutralise the original transaction's effect.

    Args:
        original_transaction: The completed Transaction to compensate.
        initiated_by: The User (must be staff/admin) authorising the compensation.
        reason: Human-readable explanation for the compensation.

    Returns:
        The newly created compensation Transaction.

    Raises:
        TransactionError: If the compensation cannot be created.
    """
    if not initiated_by.is_staff:
        raise TransactionError("Only staff members may initiate compensation transactions.")

    if original_transaction.status != Transaction.Status.COMPLETED:
        raise TransactionError(
            "Only completed transactions can be compensated. "
            f"This transaction has status '{original_transaction.status}'."
        )

    if original_transaction.is_compensation:
        raise TransactionError("A compensation transaction cannot itself be compensated.")

    # Prevent double-compensation
    if original_transaction.compensation_transactions.filter(
        status=Transaction.Status.COMPLETED
    ).exists():
        raise TransactionError(
            f"Transaction {original_transaction.transaction_reference} has already been compensated."
        )

    sender_wallet = original_transaction.wallet
    receiver_wallet = original_transaction.related_wallet
    amount = original_transaction.amount

    if receiver_wallet is None:
        raise TransactionError(
            "Cannot compensate a transaction without a receiver wallet."
        )

    description = (
        f"[COMPENSATION] Reversal of transaction {original_transaction.transaction_reference}."
        + (f" Reason: {reason}" if reason else "")
    )

    with transaction.atomic():
        # Lock both wallets
        sender_wallet_locked = Wallet.objects.select_for_update().get(pk=sender_wallet.pk)
        receiver_wallet_locked = Wallet.objects.select_for_update().get(pk=receiver_wallet.pk)

        # Reverse: money flows from receiver back to sender
        if receiver_wallet_locked.balance < amount:
            raise TransactionError(
                "The receiver's wallet has insufficient funds to process this compensation."
            )

        receiver_wallet_locked.balance -= amount
        sender_wallet_locked.balance += amount

        sender_wallet_locked.save(update_fields=["balance", "updated_at"])
        receiver_wallet_locked.save(update_fields=["balance", "updated_at"])

        compensation_tx = Transaction.objects.create(
            wallet=receiver_wallet,          # receiver of original becomes "sender" of compensation
            related_wallet=sender_wallet,    # sender of original gets funds back
            transaction_type=Transaction.TransactionType.COMPENSATION,
            amount=amount,
            status=Transaction.Status.COMPLETED,
            description=description,
            compensates=original_transaction,
        )

    compensation_created.send(
        sender=Transaction,
        compensation=compensation_tx,
        original=original_transaction,
        initiated_by=initiated_by,
    )

    return compensation_tx

