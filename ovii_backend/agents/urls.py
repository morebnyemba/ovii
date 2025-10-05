"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: URL patterns for the agents app.
"""
from django.urls import path
from .views import AgentProfileView, AgentCashInView, CustomerCashOutRequestView

urlpatterns = [
    path('profile/', AgentProfileView.as_view(), name='agent-profile'),
    path('cash-in/', AgentCashInView.as_view(), name='agent-cash-in'),
    path('cash-out/', CustomerCashOutRequestView.as_view(), name='agent-cash-out'),
]