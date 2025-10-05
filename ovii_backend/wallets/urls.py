"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-20
Description: URL patterns for the wallets app.
"""

from django.urls import path
from .views import (MyWalletView, TransactionHistoryView, CreateTransactionView)

urlpatterns = [
    path('me/', MyWalletView.as_view(), name='my-wallet'),
    path('transactions/', TransactionHistoryView.as_view(), name='transaction-history'),
    path('transfer/', CreateTransactionView.as_view(), name='create-transaction'),
]