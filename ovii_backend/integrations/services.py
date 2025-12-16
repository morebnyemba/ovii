"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: Service layer for handling third-party integrations like EcoCash and WhatsApp.
"""

import requests
from django.conf import settings
from decimal import Decimal
import hashlib
import logging
from heyoo import WhatsApp

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


class WhatsAppClient:
    """
    A client for interacting with the WhatsApp Business Cloud API.
    Uses the heyoo SDK for simplified API interactions.
    
    Credentials are loaded from:
    1. Database (WhatsAppConfig model) - preferred for runtime control
    2. Environment variables (.env) - fallback for backward compatibility
    """

    def __init__(self):
        # Try to load credentials from database first
        self.phone_number_id = None
        self.access_token = None
        self.api_version = None
        self.waba_id = None
        
        try:
            from .models import WhatsAppConfig
            config = WhatsAppConfig.objects.filter(is_active=True).first()
            if config:
                self.waba_id = config.waba_id if hasattr(config, 'waba_id') else None
                self.phone_number_id = config.phone_number_id
                self.access_token = config.access_token
                self.api_version = config.api_version
                logger.info("WhatsApp credentials loaded from database")
        except ImportError:
            # Models not available (e.g., during initial migrations)
            logger.debug("WhatsAppConfig model not available")
        except Exception as e:
            # Database errors or other issues (e.g., OperationalError during migrations)
            logger.debug(f"Could not load WhatsApp config from database: {type(e).__name__}")
        
        # Fallback to environment variables if not found in database
        if not self.phone_number_id or not self.access_token:
            self.waba_id = settings.WHATSAPP_WABA_ID
            self.phone_number_id = settings.WHATSAPP_PHONE_NUMBER_ID
            self.access_token = settings.WHATSAPP_ACCESS_TOKEN
            self.api_version = settings.WHATSAPP_API_VERSION
            if self.phone_number_id and self.access_token:
                logger.info("WhatsApp credentials loaded from environment variables")
        
        if not self.phone_number_id or not self.access_token:
            logger.warning(
                "WhatsApp credentials not configured. "
                "Configure in admin panel or set WHATSAPP_PHONE_NUMBER_ID and "
                "WHATSAPP_ACCESS_TOKEN in settings."
            )
            self.client = None
        else:
            self.client = WhatsApp(
                token=self.access_token,
                phone_number_id=self.phone_number_id
            )

    def send_text_message(self, phone_number: str, message: str) -> dict:
        """
        Sends a simple text message via WhatsApp.
        
        Args:
            phone_number: Recipient's phone number in international format (e.g., +263777123456)
            message: The text message to send
            
        Returns:
            dict: Response from WhatsApp API
            
        Raises:
            Exception: If WhatsApp is not configured or message fails to send
        """
        if not self.client:
            raise Exception("WhatsApp client not configured. Check credentials.")
        
        try:
            # Remove '+' if present for API call
            clean_number = phone_number.replace("+", "")
            response = self.client.send_message(message=message, recipient_id=clean_number)
            logger.info(f"WhatsApp message sent to {phone_number}")
            return response
        except Exception as e:
            logger.error(f"Failed to send WhatsApp message to {phone_number}: {e}")
            raise

    def send_template_message(
        self,
        phone_number: str,
        template_name: str,
        language_code: str = "en",
        components: list = None
    ) -> dict:
        """
        Sends a pre-approved WhatsApp template message.
        
        Args:
            phone_number: Recipient's phone number in international format
            template_name: Name of the approved template
            language_code: Language code for the template (default: "en")
            components: List of template components (headers, body, buttons)
            
        Returns:
            dict: Response from WhatsApp API
            
        Raises:
            Exception: If WhatsApp is not configured or message fails to send
        """
        if not self.client:
            raise Exception("WhatsApp client not configured. Check credentials.")
        
        try:
            # Remove '+' if present for API call
            clean_number = phone_number.replace("+", "")
            response = self.client.send_template(
                template=template_name,
                recipient_id=clean_number,
                lang=language_code,
                components=components or []
            )
            logger.info(f"WhatsApp template '{template_name}' sent to {phone_number}")
            return response
        except Exception as e:
            logger.error(
                f"Failed to send WhatsApp template '{template_name}' to {phone_number}: {e}"
            )
            raise

    def create_template(self, template_data: dict) -> dict:
        """
        Creates a WhatsApp message template in Meta via Graph API.
        
        Args:
            template_data: Dictionary containing template definition with keys:
                - name: Template name (lowercase, numbers, underscores only)
                - category: One of AUTHENTICATION, MARKETING, UTILITY
                - language: Language code (e.g., en_US, en)
                - components: List of template components (HEADER, BODY, FOOTER, BUTTONS)
                
        Returns:
            dict: Response from Meta Graph API containing template ID and status
            
        Raises:
            Exception: If template creation fails or WABA_ID is not configured
        """
        if not self.waba_id:
            raise Exception(
                "WABA_ID not configured. Set WHATSAPP_WABA_ID in settings or "
                "add waba_id to WhatsApp configuration in admin panel."
            )
        
        if not self.access_token:
            raise Exception("WhatsApp access token not configured.")
        
        url = f"https://graph.facebook.com/{self.api_version}/{self.waba_id}/message_templates"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.post(url, json=template_data, headers=headers, timeout=30)
            response.raise_for_status()
            result = response.json()
            logger.info(f"Template '{template_data.get('name')}' created successfully in Meta")
            return result
        except requests.exceptions.HTTPError as e:
            # Extract error details from response
            status_code = e.response.status_code if e.response else None
            error_data = {}
            
            try:
                error_data = e.response.json() if e.response else {}
            except:
                error_data = {"message": e.response.text if e.response else str(e)}
            
            error_code = error_data.get("error", {}).get("code") if isinstance(error_data.get("error"), dict) else None
            error_message = error_data.get("error", {}).get("message") if isinstance(error_data.get("error"), dict) else error_data.get("message", str(e))
            
            logger.error(f"Failed to create template '{template_data.get('name')}': HTTP {status_code}, {error_message}")
            
            # Create structured exception with status code and error code
            exception = Exception(f"Meta API error: {error_message}")
            exception.status_code = status_code
            exception.error_code = error_code
            exception.is_duplicate = status_code == 400 and (error_code == 100 or "already exists" in error_message.lower())
            raise exception
        except Exception as e:
            logger.error(f"Failed to create template '{template_data.get('name')}': {e}")
            raise

    def get_template_status(self, template_name: str) -> dict:
        """
        Retrieves the status of a template from Meta.
        
        Args:
            template_name: Name of the template to check
            
        Returns:
            dict: Template status information from Meta
            
        Raises:
            Exception: If status check fails
        """
        if not self.waba_id:
            raise Exception("WABA_ID not configured.")
        
        if not self.access_token:
            raise Exception("WhatsApp access token not configured.")
        
        url = f"https://graph.facebook.com/{self.api_version}/{self.waba_id}/message_templates"
        headers = {
            "Authorization": f"Bearer {self.access_token}"
        }
        params = {
            "name": template_name
        }
        
        try:
            response = requests.get(url, headers=headers, params=params, timeout=30)
            response.raise_for_status()
            result = response.json()
            return result
        except requests.exceptions.HTTPError as e:
            error_message = e.response.text if e.response else str(e)
            logger.error(f"Failed to get template status for '{template_name}': {error_message}")
            raise Exception(f"Meta API error: {error_message}")
        except Exception as e:
            logger.error(f"Failed to get template status for '{template_name}': {e}")
            raise
