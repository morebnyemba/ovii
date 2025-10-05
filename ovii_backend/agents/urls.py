"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: URL patterns for the agents app.
"""

from django.urls import path
from .views import AgentCashInView, CustomerCashOutRequestView

urlpatterns = [
    path('cash-in/', AgentCashInView.as_view(), name='agent-cash-in'),
    path('cash-out/', CustomerCashOutRequestView.as_view(), name='customer-cash-out'),
]