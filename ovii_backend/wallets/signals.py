"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: Defines custom signals for the wallets app.
"""

from django.dispatch import Signal

transaction_completed = Signal()
compensation_created = Signal()  # kwargs: compensation, original, initiated_by
