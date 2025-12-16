"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: URL patterns for the integrations app.
"""

from django.urls import path
from .views import (
    EcoCashWithdrawalView,
    PaynowTopUpRequestView,
    PaynowWebhookView,
    WhatsAppWebhookView,
)

urlpatterns = [
    path("ecocash/withdraw/", EcoCashWithdrawalView.as_view(), name="ecocash-withdraw"),
    path("paynow/top-up/", PaynowTopUpRequestView.as_view(), name="paynow-top-up"),
    path("webhooks/paynow/", PaynowWebhookView.as_view(), name="paynow-webhook"),
    path("webhooks/whatsapp/", WhatsAppWebhookView.as_view(), name="whatsapp-webhook"),
]
