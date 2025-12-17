"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: Service layer for handling third-party integrations like EcoCash and WhatsApp.
"""

import hashlib
import json
import logging
import traceback
from decimal import Decimal

import requests
from django.conf import settings
from heyoo import WhatsApp

logger = logging.getLogger(__name__)

# Constants for error handling
MAX_ERROR_MESSAGE_LENGTH = 500  # Maximum length for error message in logs/display


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
    
    def _create_api_exception(self, error_msg: str, error_type: str = None, 
                             status_code: int = None, error_code: str = None,
                             additional_attrs: dict = None) -> Exception:
        """
        Helper method to create a structured exception with consistent attributes.
        
        Args:
            error_msg: Main error message
            error_type: Type of error (e.g., 'ConnectionError', 'Timeout')
            status_code: HTTP status code if available
            error_code: API error code if available
            additional_attrs: Additional attributes to set on the exception
            
        Returns:
            Exception with structured attributes
        """
        exception = Exception(error_msg)
        exception.status_code = status_code
        exception.error_code = error_code
        exception.error_type = error_type
        exception.is_duplicate = False
        
        if additional_attrs:
            for key, value in additional_attrs.items():
                setattr(exception, key, value)
        
        return exception

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
        
        # Store response for error handling
        last_response = None
        
        try:
            # Log the request for debugging
            logger.debug(f"Creating template '{template_data.get('name')}'")
            logger.debug(f"Request URL: {url}")
            logger.debug(f"Request payload: {json.dumps(template_data, indent=2)}")
            
            response = requests.post(url, json=template_data, headers=headers, timeout=30)
            last_response = response  # Store for error handling
            
            # Log response status regardless of success/failure
            logger.debug(f"Response status code: {response.status_code}")
            logger.debug(f"Response headers: {dict(response.headers)}")
            logger.debug(f"Response body: {response.text}")
            
            response.raise_for_status()
            result = response.json()
            logger.info(f"Template '{template_data.get('name')}' created successfully in Meta")
            logger.debug(f"Response data: {result}")
            return result
        except requests.exceptions.HTTPError as e:
            # Extract error details from response
            # Try e.response first, fallback to last_response (stored before raise_for_status)
            response_obj = e.response if hasattr(e, 'response') and e.response is not None else last_response
            
            status_code = response_obj.status_code if response_obj else None
            response_text = response_obj.text if response_obj else None
            error_data = {}
            json_parse_error = None
            
            # Always log the raw response first for debugging
            logger.error(f"HTTP Error {status_code} when creating template '{template_data.get('name')}'")
            logger.error(f"Raw response: {response_text}")
            
            # Try to parse JSON response
            if response_obj:
                try:
                    error_data = response_obj.json()
                    logger.debug(f"Parsed error response JSON: {error_data}")
                except (json.JSONDecodeError, ValueError, TypeError) as json_err:
                    json_parse_error = str(json_err)
                    logger.warning(f"Failed to parse error response as JSON: {json_parse_error}")
                    logger.debug(f"Raw response text: {response_text}")
                    # Use raw text as fallback - store in message field for display
                    error_data = {"message": response_text}
            else:
                # No response object available
                logger.error("No response object available in HTTPError exception")
                error_data = {"message": str(e)}
            
            # Extract detailed error information with multiple fallback strategies
            error_obj = error_data.get("error", {}) if isinstance(error_data, dict) else {}
            
            # Extract error code with fallbacks
            error_code = None
            if isinstance(error_obj, dict):
                error_code = error_obj.get("code") or error_obj.get("error_code")
            
            # Extract error message with multiple fallbacks
            error_message = None
            if isinstance(error_obj, dict):
                error_message = (
                    error_obj.get("message") or 
                    error_obj.get("error_message") or 
                    error_obj.get("error_user_msg")
                )
            
            if not error_message:
                error_message = error_data.get("message") if isinstance(error_data, dict) else None
            
            if not error_message and response_text:
                # Use truncated response text as last resort
                error_message = response_text[:MAX_ERROR_MESSAGE_LENGTH] if len(response_text) > MAX_ERROR_MESSAGE_LENGTH else response_text
            
            if not error_message:
                error_message = str(e)
            
            # Extract other error fields
            error_type = error_obj.get("type") if isinstance(error_obj, dict) else None
            error_subcode = error_obj.get("error_subcode") if isinstance(error_obj, dict) else None
            error_user_title = error_obj.get("error_user_title") if isinstance(error_obj, dict) else None
            error_user_msg = error_obj.get("error_user_msg") if isinstance(error_obj, dict) else None
            fbtrace_id = error_obj.get("fbtrace_id") if isinstance(error_obj, dict) else None
            
            # Build detailed error log
            error_details = [
                f"Template: '{template_data.get('name')}'",
                f"HTTP Status: {status_code}",
                f"Error Code: {error_code}",
                f"Error Type: {error_type}",
                f"Error Subcode: {error_subcode}",
                f"Message: {error_message}",
            ]
            
            if error_user_title:
                error_details.append(f"User Title: {error_user_title}")
            if error_user_msg:
                error_details.append(f"User Message: {error_user_msg}")
            if fbtrace_id:
                error_details.append(f"FB Trace ID: {fbtrace_id}")
            if json_parse_error:
                error_details.append(f"JSON Parse Error: {json_parse_error}")
            
            # Log detailed error
            logger.error("Failed to create WhatsApp template:\n  " + "\n  ".join(error_details))
            
            # Log the full error response for debugging
            logger.debug(f"Full error response: {error_data}")
            
            # Log the request payload that failed
            logger.debug(f"Failed request payload: {json.dumps(template_data, indent=2)}")
            
            # Create structured exception with status code and error code
            additional_attrs = {
                'error_subcode': error_subcode,
                'error_user_title': error_user_title,
                'error_user_msg': error_user_msg,
                'fbtrace_id': fbtrace_id,
                'full_error': error_data,
                'raw_response': response_text
            }
            exception = self._create_api_exception(
                error_msg=f"Meta API error: {error_message}",
                error_type=error_type,
                status_code=status_code,
                error_code=error_code,
                additional_attrs=additional_attrs
            )
            
            # Check for duplicate template error
            exception.is_duplicate = (
                status_code == 400 and 
                (error_code == 100 or (error_message and "already exists" in error_message.lower()))
            )
            
            raise exception
        except requests.exceptions.ConnectionError as e:
            # Network connection error
            error_msg = f"Network connection error: {str(e)}"
            template_name = template_data.get('name', 'unknown')
            logger.error(f"Failed to create template '{template_name}': {error_msg}")
            logger.debug(f"Connection error details: {type(e).__name__} - {str(e)}")
            logger.debug(f"Request URL was: {url}")
            logger.debug(f"Template payload: {template_data}")
            raise self._create_api_exception(
                error_msg, 
                error_type="ConnectionError",
                additional_attrs={'template_name': template_name, 'request_url': url}
            )
        except requests.exceptions.Timeout as e:
            # Request timeout
            error_msg = f"Request timeout after 30 seconds: {str(e)}"
            template_name = template_data.get('name', 'unknown')
            logger.error(f"Failed to create template '{template_name}': {error_msg}")
            logger.debug(f"Timeout details: {type(e).__name__} - {str(e)}")
            logger.debug(f"Request URL was: {url}")
            logger.debug(f"Template payload: {template_data}")
            raise self._create_api_exception(
                error_msg, 
                error_type="Timeout",
                additional_attrs={'template_name': template_name, 'request_url': url}
            )
        except requests.exceptions.RequestException as e:
            # Other request-related errors (not HTTPError, ConnectionError, or Timeout)
            error_msg = f"Request error: {str(e)}"
            template_name = template_data.get('name', 'unknown')
            logger.error(f"Failed to create template '{template_name}': {error_msg}")
            logger.debug(f"Request error details: {type(e).__name__} - {str(e)}")
            logger.debug(f"Request URL was: {url}")
            logger.debug(f"Template payload: {template_data}")
            raise self._create_api_exception(
                error_msg, 
                error_type=type(e).__name__,
                additional_attrs={'template_name': template_name, 'request_url': url}
            )
        except Exception as e:
            # Catch-all for unexpected errors
            error_msg = f"Unexpected error: {str(e)}"
            template_name = template_data.get('name', 'unknown')
            logger.error(f"Failed to create template '{template_name}': {error_msg}")
            logger.debug(f"Exception type: {type(e).__name__}, Details: {str(e)}")
            logger.debug(f"Request URL was: {url}")
            logger.debug(f"Template payload: {template_data}")
            logger.debug(f"Full traceback: {traceback.format_exc()}")
            raise self._create_api_exception(
                error_msg, 
                error_type=type(e).__name__,
                additional_attrs={'template_name': template_name, 'request_url': url}
            )

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
            logger.debug(f"Checking template status for '{template_name}'")
            logger.debug(f"Request URL: {url}")
            logger.debug(f"Request params: {params}")
            
            response = requests.get(url, headers=headers, params=params, timeout=30)
            
            # Log response details
            logger.debug(f"Response status code: {response.status_code}")
            
            response.raise_for_status()
            result = response.json()
            logger.debug(f"Template status response: {result}")
            return result
        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code if e.response else None
            response_text = e.response.text if e.response else None
            
            # Try to parse error response
            try:
                error_data = e.response.json() if e.response else {}
                error_message = error_data.get("error", {}).get("message", response_text)
            except (json.JSONDecodeError, ValueError, TypeError):
                error_message = response_text or str(e)
            
            logger.error(f"Failed to get template status for '{template_name}': HTTP {status_code} - {error_message}")
            logger.debug(f"Response text: {response_text}")
            raise Exception(f"Meta API error (HTTP {status_code}): {error_message}")
        except requests.exceptions.RequestException as e:
            error_msg = f"Request error: {str(e)}"
            logger.error(f"Failed to get template status for '{template_name}': {error_msg}")
            logger.debug(f"Error type: {type(e).__name__}")
            raise Exception(error_msg)
        except Exception as e:
            logger.error(f"Failed to get template status for '{template_name}': {e}")
            logger.debug(f"Exception type: {type(e).__name__}, Details: {str(e)}")
            raise
