"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-12-09
Description: Tests for notifications app including WhatsApp functionality.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch, MagicMock
from .models import Notification
from .services import send_whatsapp_notification, send_whatsapp_template

User = get_user_model()


class NotificationModelTestCase(TestCase):
    """Test cases for Notification model."""

    def setUp(self):
        """Set up test fixtures."""
        self.user = User.objects.create_user(
            phone_number="+263777123456",
            first_name="Test",
            last_name="User"
        )

    def test_create_whatsapp_notification(self):
        """Test creating a WhatsApp notification."""
        notification = Notification.objects.create(
            recipient=self.user,
            channel=Notification.Channel.WHATSAPP,
            target=str(self.user.phone_number),
            title="Test Notification",
            message="This is a test WhatsApp notification."
        )
        
        self.assertEqual(notification.channel, Notification.Channel.WHATSAPP)
        self.assertEqual(notification.status, Notification.Status.PENDING)
        self.assertFalse(notification.is_read)

    def test_notification_channel_choices(self):
        """Test that WHATSAPP is a valid channel choice."""
        channels = [choice[0] for choice in Notification.Channel.choices]
        
        self.assertIn("WHATSAPP", channels)
        self.assertIn("EMAIL", channels)
        self.assertIn("SMS", channels)
        self.assertIn("PUSH", channels)
        self.assertIn("IN_APP", channels)


class WhatsAppNotificationServiceTestCase(TestCase):
    """Test cases for WhatsApp notification service."""

    def setUp(self):
        """Set up test fixtures."""
        self.user = User.objects.create_user(
            phone_number="+263777123456",
            first_name="Test",
            last_name="User"
        )

    @patch('notifications.services.WhatsAppClient')
    def test_send_whatsapp_notification_success(self, mock_client_class):
        """Test successful WhatsApp notification sending."""
        # Create notification
        notification = Notification.objects.create(
            recipient=self.user,
            channel=Notification.Channel.WHATSAPP,
            target=str(self.user.phone_number),
            title="Test Notification",
            message="Test message content"
        )
        
        # Mock WhatsApp client
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.send_text_message.return_value = {"messages": [{"id": "msg_123"}]}
        
        # Send notification
        send_whatsapp_notification(notification.id)
        
        # Verify
        notification.refresh_from_db()
        self.assertEqual(notification.status, Notification.Status.SENT)
        self.assertIsNotNone(notification.sent_at)
        mock_client.send_text_message.assert_called_once()

    @patch('notifications.services.WhatsAppClient')
    def test_send_whatsapp_notification_failure(self, mock_client_class):
        """Test failed WhatsApp notification sending."""
        # Create notification
        notification = Notification.objects.create(
            recipient=self.user,
            channel=Notification.Channel.WHATSAPP,
            target=str(self.user.phone_number),
            title="Test Notification",
            message="Test message content"
        )
        
        # Mock WhatsApp client to raise exception
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.send_text_message.side_effect = Exception("API Error")
        
        # Send notification
        send_whatsapp_notification(notification.id)
        
        # Verify
        notification.refresh_from_db()
        self.assertEqual(notification.status, Notification.Status.FAILED)

    @patch('notifications.services.WhatsAppClient')
    @patch('notifications.services.format_template_components')
    def test_send_whatsapp_template_success(self, mock_format, mock_client_class):
        """Test successful WhatsApp template sending."""
        mock_format.return_value = [
            {"type": "body", "parameters": [{"type": "text", "text": "123456"}]}
        ]
        
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.send_template_message.return_value = {"messages": [{"id": "msg_789"}]}
        
        response = send_whatsapp_template(
            phone_number="+263777123456",
            template_name="otp_verification",
            variables={"code": "123456"}
        )
        
        self.assertIn("messages", response)
        mock_client.send_template_message.assert_called_once()

    def test_send_whatsapp_notification_nonexistent(self):
        """Test sending notification that doesn't exist."""
        # This should log an error but not raise an exception
        send_whatsapp_notification(99999)
        # No assertion needed - just verify it doesn't crash
