"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-12-09
Description: Tests for integrations app including WhatsApp functionality.
"""

from django.test import TestCase
from unittest.mock import patch, MagicMock
from .services import WhatsAppClient
from .whatsapp_templates import get_template_structure, format_template_components


class WhatsAppClientTestCase(TestCase):
    """Test cases for WhatsApp Cloud API client."""

    def setUp(self):
        """Set up test fixtures."""
        self.phone_number = "+263777123456"
        self.message = "Test message"

    @patch('integrations.services.settings')
    @patch('integrations.services.WhatsApp')
    def test_whatsapp_client_initialization(self, mock_whatsapp, mock_settings):
        """Test WhatsApp client initialization with valid credentials."""
        mock_settings.WHATSAPP_PHONE_NUMBER_ID = "test_phone_id"
        mock_settings.WHATSAPP_ACCESS_TOKEN = "test_token"
        mock_settings.WHATSAPP_API_VERSION = "v18.0"
        
        client = WhatsAppClient()
        
        self.assertIsNotNone(client.client)
        mock_whatsapp.assert_called_once_with(
            token="test_token",
            phone_number_id="test_phone_id"
        )

    @patch('integrations.services.settings')
    def test_whatsapp_client_no_credentials(self, mock_settings):
        """Test WhatsApp client initialization without credentials."""
        mock_settings.WHATSAPP_PHONE_NUMBER_ID = None
        mock_settings.WHATSAPP_ACCESS_TOKEN = None
        mock_settings.WHATSAPP_API_VERSION = "v18.0"
        
        client = WhatsAppClient()
        
        self.assertIsNone(client.client)

    @patch('integrations.services.settings')
    @patch('integrations.services.WhatsApp')
    def test_send_text_message(self, mock_whatsapp, mock_settings):
        """Test sending a text message via WhatsApp."""
        mock_settings.WHATSAPP_PHONE_NUMBER_ID = "test_phone_id"
        mock_settings.WHATSAPP_ACCESS_TOKEN = "test_token"
        mock_settings.WHATSAPP_API_VERSION = "v18.0"
        
        mock_client_instance = MagicMock()
        mock_whatsapp.return_value = mock_client_instance
        mock_client_instance.send_message.return_value = {"messages": [{"id": "msg_123"}]}
        
        client = WhatsAppClient()
        response = client.send_text_message(self.phone_number, self.message)
        
        mock_client_instance.send_message.assert_called_once_with(
            message=self.message,
            recipient_id="263777123456"  # Without the +
        )
        self.assertIn("messages", response)

    @patch('integrations.services.settings')
    @patch('integrations.services.WhatsApp')
    def test_send_template_message(self, mock_whatsapp, mock_settings):
        """Test sending a template message via WhatsApp."""
        mock_settings.WHATSAPP_PHONE_NUMBER_ID = "test_phone_id"
        mock_settings.WHATSAPP_ACCESS_TOKEN = "test_token"
        mock_settings.WHATSAPP_API_VERSION = "v18.0"
        
        mock_client_instance = MagicMock()
        mock_whatsapp.return_value = mock_client_instance
        mock_client_instance.send_template.return_value = {"messages": [{"id": "msg_456"}]}
        
        client = WhatsAppClient()
        components = [{"type": "body", "parameters": [{"type": "text", "text": "123456"}]}]
        response = client.send_template_message(
            self.phone_number,
            "otp_verification",
            components=components
        )
        
        mock_client_instance.send_template.assert_called_once()
        self.assertIn("messages", response)


class WhatsAppTemplatesTestCase(TestCase):
    """Test cases for WhatsApp template management."""

    def test_get_template_structure(self):
        """Test retrieving template structure."""
        template = get_template_structure("otp_verification")
        
        self.assertIsNotNone(template)
        self.assertEqual(template["name"], "otp_verification")
        self.assertEqual(template["category"], "AUTHENTICATION")
        self.assertIn("structure", template)

    def test_get_nonexistent_template(self):
        """Test retrieving a non-existent template."""
        template = get_template_structure("nonexistent_template")
        
        self.assertIsNone(template)

    def test_format_template_components(self):
        """Test formatting template components with variables."""
        variables = {"code": "123456"}
        components = format_template_components("otp_verification", variables)
        
        self.assertIsInstance(components, list)
        self.assertEqual(len(components), 1)
        self.assertEqual(components[0]["type"], "body")
        self.assertEqual(components[0]["parameters"][0]["text"], "123456")

    def test_format_template_components_multiple_variables(self):
        """Test formatting template with multiple variables."""
        variables = {
            "amount": "10.00",
            "currency": "USD",
            "sender_name": "John Doe",
            "new_balance": "110.00",
            "transaction_id": "TXN123456"
        }
        components = format_template_components("transaction_received", variables)
        
        self.assertIsInstance(components, list)
        self.assertEqual(len(components), 1)
        self.assertEqual(len(components[0]["parameters"]), 6)  # Including duplicate currency

    def test_format_template_components_invalid_template(self):
        """Test formatting with invalid template name."""
        with self.assertRaises(ValueError):
            format_template_components("invalid_template", {})
