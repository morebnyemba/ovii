"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-12-09
Description: Tests for integrations app including WhatsApp functionality.
"""

from django.test import TestCase
from unittest.mock import patch, MagicMock
from .services import WhatsAppClient
from .whatsapp_templates import get_template_structure, format_template_components
from .models import WhatsAppConfig


class WhatsAppClientTestCase(TestCase):
    """Test cases for WhatsApp Cloud API client."""

    def setUp(self):
        """Set up test fixtures."""
        self.phone_number = "+263777123456"
        self.message = "Test message"

    @patch('integrations.services.WhatsApp')
    def test_whatsapp_client_initialization_from_database(self, mock_whatsapp):
        """Test WhatsApp client initialization with credentials from database."""
        # Create a WhatsApp config in the database
        WhatsAppConfig.objects.create(
            phone_number_id="test_db_phone_id",
            access_token="test_db_token",
            api_version="v18.0",
            is_active=True
        )
        
        client = WhatsAppClient()
        
        self.assertIsNotNone(client.client)
        self.assertEqual(client.phone_number_id, "test_db_phone_id")
        self.assertEqual(client.access_token, "test_db_token")
        mock_whatsapp.assert_called_once_with(
            token="test_db_token",
            phone_number_id="test_db_phone_id"
        )

    @patch('integrations.services.settings')
    @patch('integrations.services.WhatsApp')
    def test_whatsapp_client_initialization_from_env(self, mock_whatsapp, mock_settings):
        """Test WhatsApp client initialization with credentials from environment variables."""
        mock_settings.WHATSAPP_PHONE_NUMBER_ID = "test_env_phone_id"
        mock_settings.WHATSAPP_ACCESS_TOKEN = "test_env_token"
        mock_settings.WHATSAPP_API_VERSION = "v18.0"
        
        client = WhatsAppClient()
        
        self.assertIsNotNone(client.client)
        self.assertEqual(client.phone_number_id, "test_env_phone_id")
        self.assertEqual(client.access_token, "test_env_token")
        mock_whatsapp.assert_called_once_with(
            token="test_env_token",
            phone_number_id="test_env_phone_id"
        )

    @patch('integrations.services.WhatsApp')
    def test_whatsapp_client_database_precedence(self, mock_whatsapp):
        """Test that database credentials take precedence over environment variables."""
        # Create a WhatsApp config in the database
        WhatsAppConfig.objects.create(
            phone_number_id="test_db_phone_id",
            access_token="test_db_token",
            api_version="v19.0",
            is_active=True
        )
        
        with patch('integrations.services.settings') as mock_settings:
            mock_settings.WHATSAPP_PHONE_NUMBER_ID = "test_env_phone_id"
            mock_settings.WHATSAPP_ACCESS_TOKEN = "test_env_token"
            mock_settings.WHATSAPP_API_VERSION = "v18.0"
            
            client = WhatsAppClient()
            
            # Database credentials should be used
            self.assertEqual(client.phone_number_id, "test_db_phone_id")
            self.assertEqual(client.access_token, "test_db_token")
            self.assertEqual(client.api_version, "v19.0")

    @patch('integrations.services.settings')
    def test_whatsapp_client_no_credentials(self, mock_settings):
        """Test WhatsApp client initialization without credentials."""
        mock_settings.WHATSAPP_PHONE_NUMBER_ID = None
        mock_settings.WHATSAPP_ACCESS_TOKEN = None
        mock_settings.WHATSAPP_API_VERSION = "v18.0"
        
        client = WhatsAppClient()
        
        self.assertIsNone(client.client)

    @patch('integrations.services.WhatsApp')
    def test_send_text_message(self, mock_whatsapp):
        """Test sending a text message via WhatsApp."""
        # Create a WhatsApp config in the database
        WhatsAppConfig.objects.create(
            phone_number_id="test_phone_id",
            access_token="test_token",
            api_version="v18.0",
            is_active=True
        )
        
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

    @patch('integrations.services.WhatsApp')
    def test_send_template_message(self, mock_whatsapp):
        """Test sending a template message via WhatsApp."""
        # Create a WhatsApp config in the database
        WhatsAppConfig.objects.create(
            phone_number_id="test_phone_id",
            access_token="test_token",
            api_version="v18.0",
            is_active=True
        )
        
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


class WhatsAppConfigModelTestCase(TestCase):
    """Test cases for WhatsAppConfig model."""

    def test_create_whatsapp_config(self):
        """Test creating a WhatsApp configuration."""
        config = WhatsAppConfig.objects.create(
            phone_number_id="test_phone_id",
            access_token="test_token",
            api_version="v18.0",
            webhook_verify_token="test_verify_token",
            is_active=True
        )
        
        self.assertEqual(config.phone_number_id, "test_phone_id")
        self.assertEqual(config.access_token, "test_token")
        self.assertEqual(config.api_version, "v18.0")
        self.assertTrue(config.is_active)

    def test_only_one_active_config(self):
        """Test that only one active configuration is allowed."""
        # Create first active config
        WhatsAppConfig.objects.create(
            phone_number_id="test_phone_id_1",
            access_token="test_token_1",
            api_version="v18.0",
            is_active=True
        )
        
        # Try to create second active config - should raise ValidationError
        config2 = WhatsAppConfig(
            phone_number_id="test_phone_id_2",
            access_token="test_token_2",
            api_version="v18.0",
            is_active=True
        )
        
        with self.assertRaises(Exception):  # ValidationError is raised
            config2.save()

    def test_multiple_inactive_configs(self):
        """Test that multiple inactive configurations are allowed."""
        WhatsAppConfig.objects.create(
            phone_number_id="test_phone_id_1",
            access_token="test_token_1",
            api_version="v18.0",
            is_active=False
        )
        
        config2 = WhatsAppConfig.objects.create(
            phone_number_id="test_phone_id_2",
            access_token="test_token_2",
            api_version="v18.0",
            is_active=False
        )
        
        self.assertEqual(WhatsAppConfig.objects.filter(is_active=False).count(), 2)

    def test_config_string_representation(self):
        """Test the string representation of WhatsAppConfig."""
        config = WhatsAppConfig.objects.create(
            phone_number_id="123456789012345",
            access_token="test_token",
            api_version="v18.0",
            is_active=True
        )
        
        self.assertIn("123456789012345", str(config))


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


class WhatsAppTemplateSyncTestCase(TestCase):
    """Test cases for WhatsApp template sync functionality."""

    def setUp(self):
        """Set up test fixtures."""
        from .models import WhatsAppTemplate
        self.waba_id = "123456789"
        self.access_token = "test_token"
        self.template_name = "otp_verification"

    @patch('integrations.services.WhatsApp')
    def test_whatsapp_client_loads_waba_id_from_database(self, mock_whatsapp):
        """Test WhatsApp client loads WABA_ID from database."""
        WhatsAppConfig.objects.create(
            waba_id=self.waba_id,
            phone_number_id="test_phone_id",
            access_token=self.access_token,
            api_version="v18.0",
            is_active=True
        )
        
        client = WhatsAppClient()
        
        self.assertEqual(client.waba_id, self.waba_id)
        self.assertEqual(client.access_token, self.access_token)

    @patch('integrations.services.requests.post')
    @patch('integrations.services.WhatsApp')
    def test_create_template_success(self, mock_whatsapp, mock_post):
        """Test successful template creation via Meta API."""
        # Setup
        WhatsAppConfig.objects.create(
            waba_id=self.waba_id,
            phone_number_id="test_phone_id",
            access_token=self.access_token,
            api_version="v18.0",
            is_active=True
        )
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "id": "template_12345",
            "status": "PENDING",
            "category": "AUTHENTICATION"
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response
        
        # Test
        client = WhatsAppClient()
        template_data = {
            "name": "test_template",
            "category": "AUTHENTICATION",
            "language": "en_US",
            "components": [{"type": "BODY", "text": "Test message"}]
        }
        result = client.create_template(template_data)
        
        # Assert
        self.assertEqual(result["id"], "template_12345")
        self.assertEqual(result["status"], "PENDING")
        mock_post.assert_called_once()
        
        # Verify API call
        call_args = mock_post.call_args
        self.assertIn(self.waba_id, call_args[0][0])
        self.assertIn("message_templates", call_args[0][0])

    @patch('integrations.services.WhatsApp')
    def test_create_template_no_waba_id(self, mock_whatsapp):
        """Test template creation fails without WABA_ID."""
        WhatsAppConfig.objects.create(
            waba_id="",
            phone_number_id="test_phone_id",
            access_token=self.access_token,
            api_version="v18.0",
            is_active=True
        )
        
        client = WhatsAppClient()
        template_data = {"name": "test"}
        
        with self.assertRaises(Exception) as context:
            client.create_template(template_data)
        
        self.assertIn("WABA_ID not configured", str(context.exception))

    @patch('integrations.services.requests.post')
    @patch('integrations.services.WhatsApp')
    def test_create_template_api_error(self, mock_whatsapp, mock_post):
        """Test template creation handles API errors."""
        WhatsAppConfig.objects.create(
            waba_id=self.waba_id,
            phone_number_id="test_phone_id",
            access_token=self.access_token,
            api_version="v18.0",
            is_active=True
        )
        
        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = Exception("API Error")
        mock_response.text = "Error details"
        mock_post.return_value = mock_response
        
        client = WhatsAppClient()
        template_data = {"name": "test"}
        
        with self.assertRaises(Exception):
            client.create_template(template_data)

    @patch('integrations.services.requests.get')
    @patch('integrations.services.WhatsApp')
    def test_get_template_status(self, mock_whatsapp, mock_get):
        """Test retrieving template status from Meta."""
        WhatsAppConfig.objects.create(
            waba_id=self.waba_id,
            phone_number_id="test_phone_id",
            access_token=self.access_token,
            api_version="v18.0",
            is_active=True
        )
        
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "data": [{
                "id": "template_12345",
                "name": "test_template",
                "status": "APPROVED"
            }]
        }
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response
        
        client = WhatsAppClient()
        result = client.get_template_status("test_template")
        
        self.assertIn("data", result)
        self.assertEqual(result["data"][0]["status"], "APPROVED")
        mock_get.assert_called_once()

    def test_convert_template_to_meta_format(self):
        """Test conversion of internal template format to Meta format."""
        from .whatsapp_templates import convert_template_to_meta_format
        
        result = convert_template_to_meta_format("otp_verification")
        
        # Check required fields
        self.assertEqual(result["name"], "otp_verification")
        self.assertEqual(result["category"], "AUTHENTICATION")
        self.assertEqual(result["language"], "en_US")
        self.assertIn("components", result)
        
        # Check components
        components = result["components"]
        body_component = next(c for c in components if c["type"] == "BODY")
        self.assertIn("{{1}}", body_component["text"])
        
        # Check footer
        footer_component = next((c for c in components if c["type"] == "FOOTER"), None)
        self.assertIsNotNone(footer_component)

    def test_convert_template_invalid_name(self):
        """Test conversion with invalid template name."""
        from .whatsapp_templates import convert_template_to_meta_format
        
        with self.assertRaises(ValueError):
            convert_template_to_meta_format("invalid_template_name")

    def test_whatsapp_template_model_creation(self):
        """Test WhatsAppTemplate model creation."""
        from .models import WhatsAppTemplate
        
        template = WhatsAppTemplate.objects.create(
            name="test_template",
            category="MARKETING",
            language="en",
            status="PENDING"
        )
        
        self.assertEqual(template.name, "test_template")
        self.assertEqual(template.status, "PENDING")
        self.assertIsNone(template.template_id)
        self.assertIsNone(template.last_synced_at)

    def test_whatsapp_template_unique_constraint(self):
        """Test unique constraint on template name and language."""
        from .models import WhatsAppTemplate
        from django.db import IntegrityError
        
        WhatsAppTemplate.objects.create(
            name="test_template",
            category="MARKETING",
            language="en"
        )
        
        # Try to create duplicate
        with self.assertRaises(IntegrityError):
            WhatsAppTemplate.objects.create(
                name="test_template",
                category="MARKETING",
                language="en"
            )
