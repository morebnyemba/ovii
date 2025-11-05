"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: Service layer for handling third-party integrations like EcoCash.
"""

import requests
from django.conf import settings
from decimal import Decimal
import hashlib
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

    def send_b2c_payment(
        self, phone_number: str, amount: Decimal, reference: str
    ) -> dict:
        """
        Initiates a Business-to-Customer (B2C) payment.
        This pushes funds from our business account to a customer's EcoCash wallet.
        """
        url = f"{self.api_base_url}/b2c/payments/"
        payload = {
            "customer_phone": phone_number,
            "amount": str(amount),
            "transaction_reference": reference,
            "callback_url": settings.ECOCASH_WEBHOOK_URL,  # Optional: For confirmation
        }
        try:
            response = requests.post(
                url, json=payload, headers=self._get_auth_headers(), timeout=20
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"EcoCash B2C payment failed for ref {reference}: {e}")
            raise


class PaynowClient:
    """
    A client for interacting with the Paynow payment gateway API.
    """

    def __init__(self):
        self.integration_id = settings.PAYNOW_INTEGRATION_ID
        self.integration_key = settings.PAYNOW_INTEGRATION_KEY
        self.initiate_transaction_url = f"{settings.PAYNOW_API_URL}/initiatetransaction"

    def _generate_hash(self, values_string: str) -> str:
        """Generates a SHA512 hash as required by Paynow."""
        values_string += self.integration_key
        return hashlib.sha512(values_string.encode("utf-8")).hexdigest().upper()

    def create_transaction(
        self, reference: str, amount: Decimal, user_email: str
    ) -> dict:
        """
        Initiates a transaction with Paynow and returns the response.
        """
        payload = {
            "id": self.integration_id,
            "reference": reference,
            "amount": str(amount),
            "additionalinfo": f"Ovii Wallet Top-up for {user_email}",
            "returnurl": settings.PAYNOW_RETURN_URL,
            "resulturl": settings.PAYNOW_RESULT_URL,
            "status": "Message",
        }

        # Create the concatenated string for hashing
        hash_string = "".join(str(v) for v in payload.values())
        payload["hash"] = self._generate_hash(hash_string)

        try:
            response = requests.post(
                self.initiate_transaction_url, data=payload, timeout=20
            )
            response.raise_for_status()
            # Paynow returns a URL-encoded string, so we need to parse it.
            from urllib.parse import parse_qs

            parsed_response = {k: v[0] for k, v in parse_qs(response.text).items()}

            if parsed_response.get("status", "").lower() != "ok":
                error_message = parsed_response.get(
                    "error", "Unknown error from Paynow."
                )
                raise Exception(error_message)

            return parsed_response

        except requests.RequestException as e:
            logger.error(
                f"Paynow initiate transaction request failed for ref {reference}: {e}"
            )
            raise

    def verify_webhook_hash(self, data: dict) -> bool:
        """
        Verifies the hash from an incoming Paynow webhook.
        The order of concatenation is critical and must match Paynow's documentation.
        """
        hash_to_verify = data.get("hash", "")
        if not hash_to_verify:
            return False

        # Create the concatenated string for hashing from the POST data, excluding the hash itself.
        # The order of values is critical for the hash to be correct.
        values_string = "".join(str(v) for k, v in data.items() if k.lower() != "hash")
        expected_hash = self._generate_hash(values_string)

        return hash_to_verify.upper() == expected_hash
