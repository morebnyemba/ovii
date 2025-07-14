"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-20
Description: Defines the Wallet and Transaction models for the wallets app.
"""

from decimal import Decimal
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class Wallet(models.Model):
    """
    Represents a user's wallet in the system.

    Each user has a single wallet to store their balance in a specific currency.
    """
    # A one-to-one link to the user who owns this wallet.
    # If the user is deleted, their wallet is also deleted (CASCADE).
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='wallet'
    )

    # The current balance of the wallet.
    # Using DecimalField is crucial for financial calculations to avoid floating-point errors.
    balance = models.DecimalField(
        _('balance'),
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00')
    )

    # The currency of the wallet, using ISO 4217 currency codes.
    currency = models.CharField(_('currency'), max_length=3, default='USD')

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
        PENDING = 'PENDING', _('Pending')
        COMPLETED = 'COMPLETED', _('Completed')
        FAILED = 'FAILED', _('Failed')

    # The wallet from which the funds are being sent.
    # PROTECT prevents deletion of a wallet if it has associated transactions.
    source_wallet = models.ForeignKey(
        Wallet,
        on_delete=models.PROTECT,
        related_name='sent_transactions'
    )

    # The wallet that is receiving the funds.
    destination_wallet = models.ForeignKey(
        Wallet,
        on_delete=models.PROTECT,
        related_name='received_transactions'
    )

    # The amount of money being transferred in the transaction.
    amount = models.DecimalField(_('amount'), max_digits=12, decimal_places=2)

    # The current status of the transaction.
    status = models.CharField(
        _('status'),
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING
    )

    # Timestamp for when the transaction was initiated.
    timestamp = models.DateTimeField(_('timestamp'), auto_now_add=True)

    # TODO (Phase 3): Add a transaction_type field (e.g., P2P, Merchant Payment, Withdrawal).

    def __str__(self):
        """Returns a string representation of the transaction."""
        return f"From {self.source_wallet.user} to {self.destination_wallet.user} - {self.amount}"