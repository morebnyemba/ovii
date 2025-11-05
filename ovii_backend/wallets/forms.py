"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: Defines forms for the wallets app, used in the admin panel.
"""

from django import forms
from decimal import Decimal


class WalletTopUpForm(forms.Form):
    amount = forms.DecimalField(
        label="Top-up Amount",
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.01"),
    )
    reason = forms.CharField(
        label="Reason/Reference",
        max_length=255,
        help_text="e.g., 'Agent float deposit, Ref #12345'",
    )
