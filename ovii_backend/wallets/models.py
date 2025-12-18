"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-20
Description: Defines the Wallet and Transaction models for the wallets app.
"""

import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class SystemWallet(models.Model):
    """
    Represents a system-level wallet, e.g., for collecting fees.
    """
    name = models.CharField(_("wallet name"), max_length=100, unique=True)
    balance = models.DecimalField(
        _("balance"), max_digits=12, decimal_places=2, default=Decimal("0.00")
    )

    def __str__(self):
        return f"{self.name}: {self.balance}"


class TransactionCharge(models.Model):
    """
    Defines a rule for applying a transaction charge.
    """

    class ChargeType(models.TextChoices):
        PERCENTAGE = "PERCENTAGE", _("Percentage")
        FIXED = "FIXED", _("Fixed Amount")

    class AppliesTo(models.TextChoices):
        SENDER = "SENDER", _("Sender")
        RECEIVER = "RECEIVER", _("Receiver")

    name = models.CharField(_("charge name"), max_length=100, unique=True)
    charge_type = models.CharField(
        _("charge type"), max_length=20, choices=ChargeType.choices
    )
    value = models.DecimalField(
        _("value"),
        max_digits=10,
        decimal_places=2,
        help_text=_("The percentage or fixed amount of the charge."),
    )
    applies_to = models.CharField(
        _("applies to"), max_length=20, choices=AppliesTo.choices, default=AppliesTo.SENDER
    )
    min_charge = models.DecimalField(
        _("minimum charge"), max_digits=10, decimal_places=2, default=0.00
    )
    max_charge = models.DecimalField(
        _("maximum charge"), max_digits=10, decimal_places=2, null=True, blank=True
    )
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

    def calculate_charge(self, amount):
        """
        Calculates the charge for a given transaction amount.
        """
        if self.charge_type == self.ChargeType.PERCENTAGE:
            charge = (self.value / 100) * amount
        else:
            charge = self.value

        if self.max_charge is not None:
            charge = min(charge, self.max_charge)

        return max(charge, self.min_charge)


class Wallet(models.Model):
    """
    Represents a user's wallet in the system.

    Each user has a single wallet to store their balance in a specific currency.
    """

    # A one-to-one link to the user who owns this wallet.
    # If the user is deleted, their wallet is also deleted (CASCADE).
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="wallet"
    )

    # The current balance of the wallet.
    # Using DecimalField is crucial for financial calculations to avoid floating-point errors.
    balance = models.DecimalField(
        _("balance"), max_digits=12, decimal_places=2, default=Decimal("0.00")
    )

    # The currency of the wallet, using ISO 4217 currency codes.
    currency = models.CharField(_("currency"), max_length=3, default="USD")

    # Timestamp for when the wallet was created.
    created_at = models.DateTimeField(auto_now_add=True)

    # Timestamp for the last time the wallet was updated.
    updated_at = models.DateTimeField(auto_now=True)

    # TODO (Phase 2): Add a tier field (e.g., Individual, Business) to manage different wallet types and limits.

    def __str__(self):
        """Returns a string representation of the wallet."""
        return f"{self.user} - {self.balance} {self.currency}"


class Transaction(models.Model):
    """
    Represents a single financial transaction between two wallets.
    """

    class Status(models.TextChoices):
        """Defines the status of a transaction."""

        PENDING = "PENDING", _("Pending")
        COMPLETED = "COMPLETED", _("Completed")
        FAILED = "FAILED", _("Failed")

    class TransactionType(models.TextChoices):
        """Defines the type of transaction."""

        TRANSFER = "TRANSFER", _("Transfer")
        DEPOSIT = "DEPOSIT", _("Deposit")
        WITHDRAWAL = "WITHDRAWAL", _("Withdrawal")
        PAYMENT = "PAYMENT", _("Payment")
        COMMISSION = "COMMISSION", _("Commission")

    # The primary wallet involved in the transaction (e.g., the sender).
    wallet = models.ForeignKey(
        Wallet, on_delete=models.PROTECT, related_name="transactions"
    )

    # The other wallet in the transaction (e.g., the receiver). Can be null for deposits/withdrawals.
    related_wallet = models.ForeignKey(
        Wallet,
        on_delete=models.PROTECT,
        related_name="related_transactions",
        null=True,
        blank=True,
    )

    # The amount of money in the transaction.
    amount = models.DecimalField(_("amount"), max_digits=12, decimal_places=2)

    # The charge for the transaction.
    charge = models.ForeignKey(
        TransactionCharge,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transactions",
    )
    charge_amount = models.DecimalField(
        _("charge amount"), max_digits=12, decimal_places=2, default=Decimal("0.00")
    )

    # The current status of the transaction.
    status = models.CharField(
        _("status"), max_length=10, choices=Status.choices, default=Status.PENDING
    )

    # The type of transaction.
    transaction_type = models.CharField(
        _("transaction type"),
        max_length=20,
        choices=TransactionType.choices,
        default=TransactionType.TRANSFER,
    )

    # Timestamp for when the transaction was initiated.
    timestamp = models.DateTimeField(_("timestamp"), auto_now_add=True)

    # Human-readable transaction reference with prefix (TR, CO, MP) and 8-digit UUID
    transaction_reference = models.CharField(
        _("transaction reference"),
        max_length=20,
        unique=True,
        editable=False,
        help_text=_("Unique transaction reference (e.g., TR-A1B2C3D4)"),
    )

    # --- Denormalized fields for historical accuracy and query performance ---
    # Store the identifier of the sender and receiver at the time of the transaction.
    # This is crucial because a user might change their phone number, but the transaction
    # record should remain unchanged.
    sender_identifier = models.CharField(
        max_length=50,
        editable=False,
        help_text=_("Identifier of the sender (e.g., phone number)"),
    )
    receiver_identifier = models.CharField(
        max_length=50,
        editable=False,
        null=True,
        blank=True,
        help_text=_("Identifier of the receiver (e.g., phone number)"),
    )

    description = models.CharField(_("description"), max_length=255, blank=True)

    def _generate_transaction_reference(self):
        """
        Generate a unique transaction reference based on transaction type.
        Format: PREFIX-XXXXXXXX (8 hexadecimal characters from UUID)
        
        Prefixes:
        - TR: Transfer
        - CO: Cash-out (Withdrawal)
        - MP: Merchant Payment
        - DP: Deposit
        - CM: Commission
        """
        prefix_map = {
            self.TransactionType.TRANSFER: "TR",
            self.TransactionType.WITHDRAWAL: "CO",
            self.TransactionType.PAYMENT: "MP",
            self.TransactionType.DEPOSIT: "DP",
            self.TransactionType.COMMISSION: "CM",
        }
        
        prefix = prefix_map.get(self.transaction_type, "TR")
        # Generate 8-character hexadecimal from UUID
        unique_id = uuid.uuid4().hex[:8].upper()
        return f"{prefix}-{unique_id}"

    def __str__(self):
        """Returns a string representation of the transaction."""
        if self.related_wallet:
            return f"{self.get_transaction_type_display()}: {self.sender_identifier} to {self.receiver_identifier} - {self.amount}"
        return f"{self.get_transaction_type_display()}: {self.sender_identifier} - {self.amount}"

    def save(self, *args, **kwargs):
        # Automatically populate the identifier fields before saving.
        self.sender_identifier = str(self.wallet.user.phone_number)
        if self.related_wallet:
            self.receiver_identifier = str(self.related_wallet.user.phone_number)
        
        # Generate transaction reference if not already set
        if not self.transaction_reference:
            self.transaction_reference = self._generate_transaction_reference()
            # Ensure uniqueness - regenerate if collision occurs
            # Note: UUID collisions are extremely rare (1 in 2^32 for 8 hex chars)
            # This loop will almost never execute more than once
            max_attempts = 5  # Safety limit to prevent infinite loop
            attempts = 0
            while Transaction.objects.filter(transaction_reference=self.transaction_reference).exists():
                if attempts >= max_attempts:
                    # This should never happen, but log it if it does
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Failed to generate unique transaction reference after {max_attempts} attempts")
                    break
                self.transaction_reference = self._generate_transaction_reference()
                attempts += 1
        
        super().save(*args, **kwargs)
