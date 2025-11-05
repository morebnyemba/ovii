"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: Service layer for handling third-party integrations like EcoCash.
"""

import requests
from django.conf import settings
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)


class EcoCashClient:
    """
    A client for interacting with the (hypothetical) EcoCash B2B API.
    """

    def __init__(self):
        self.api_base_url = settings.ECOCASH_API_URL
        self.api_key = settings.ECOCASH_API_KEY
        self.api_secret = settings.ECOCASH_API_SECRET

    def _get_auth_headers(self):
        # This is a placeholder. The actual authentication method
        # (e.g., Basic Auth, OAuth2) would be specified by EcoCash.
        return {
            "Authorization": f"Bearer {self.api_key}:{self.api_secret}",
            "Content-Type": "application/json",
        }

    def request_c2b_payment(
        self, phone_number: str, amount: Decimal, reference: str
    ) -> dict:
        """
        Initiates a Customer-to-Business (C2B) payment request.
        This asks the customer to approve a payment from their EcoCash wallet.
        """
        url = f"{self.api_base_url}/c2b/payment-requests/"
        payload = {
            "customer_phone": phone_number,
            "amount": str(amount),
            "transaction_reference": reference,
            "callback_url": settings.ECOCASH_WEBHOOK_URL,  # Your webhook endpoint
        }
        try:
            response = requests.post(
                url, json=payload, headers=self._get_auth_headers(), timeout=15
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"EcoCash C2B request failed for ref {reference}: {e}")
            raise
