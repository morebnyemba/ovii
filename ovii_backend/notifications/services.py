from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Notification
from integrations.services import WhatsAppClient
from integrations.whatsapp_templates import format_template_components

import logging

logger = logging.getLogger(__name__)


def send_email_notification(notification_id):
    try:
        notification = Notification.objects.get(id=notification_id)
        send_mail(
            notification.title,
            notification.message,
            settings.DEFAULT_FROM_EMAIL,
            [notification.target],
            fail_silently=False,
        )
        notification.status = Notification.Status.SENT
        notification.sent_at = timezone.now()
        notification.save()
        logger.info(f"Email notification {notification_id} sent successfully.")
    except Notification.DoesNotExist:
        logger.error(f"Notification with id {notification_id} does not exist.")
    except Exception as e:
        logger.error(f"Failed to send email notification {notification_id}: {e}")
        if "notification" in locals():
            notification.status = Notification.Status.FAILED
            notification.save()


def send_sms_notification(notification_id):
    # This is a placeholder. You would integrate with an SMS gateway like Twilio here.
    try:
        notification = Notification.objects.get(id=notification_id)
        logger.info(f"--- SIMULATING SMS --- ")
        logger.info(f"TO: {notification.target}")
        logger.info(f"MESSAGE: {notification.message}")
        logger.info(f"--- END SIMULATING SMS ---")
        notification.status = Notification.Status.SENT
        notification.sent_at = timezone.now()
        notification.save()
        logger.info(
            f"SMS notification {notification_id} sent successfully (simulated)."
        )
    except Notification.DoesNotExist:
        logger.error(f"Notification with id {notification_id} does not exist.")
    except Exception as e:
        logger.error(f"Failed to send SMS notification {notification_id}: {e}")
        if "notification" in locals():
            notification.status = Notification.Status.FAILED
            notification.save()


def send_whatsapp_notification(notification_id):
    """
    Send a notification via WhatsApp using the WhatsApp Business Cloud API.
    This function sends either a template message or a plain text message.
    """
    try:
        notification = Notification.objects.get(id=notification_id)
        client = WhatsAppClient()
        
        # Send the message via WhatsApp
        client.send_text_message(
            phone_number=notification.target,
            message=f"{notification.title}\n\n{notification.message}"
        )
        
        notification.status = Notification.Status.SENT
        notification.sent_at = timezone.now()
        notification.save()
        logger.info(f"WhatsApp notification {notification_id} sent successfully.")
    except Notification.DoesNotExist:
        logger.error(f"Notification with id {notification_id} does not exist.")
    except Exception as e:
        logger.error(f"Failed to send WhatsApp notification {notification_id}: {e}")
        if "notification" in locals():
            notification.status = Notification.Status.FAILED
            notification.save()


def send_whatsapp_template(
    phone_number: str,
    template_name: str,
    variables: dict,
    language_code: str = "en"
) -> dict:
    """
    Send a pre-approved WhatsApp template message.
    
    Args:
        phone_number: Recipient's phone number in international format
        template_name: Name of the approved template
        variables: Dictionary of template variables
        language_code: Language code for the template (default: "en")
        
    Returns:
        dict: Response from WhatsApp API
    """
    try:
        client = WhatsAppClient()
        components = format_template_components(template_name, variables)
        
        response = client.send_template_message(
            phone_number=phone_number,
            template_name=template_name,
            language_code=language_code,
            components=components
        )
        
        logger.info(
            f"WhatsApp template '{template_name}' sent successfully to {phone_number}"
        )
        return response
    except Exception as e:
        logger.error(
            f"Failed to send WhatsApp template '{template_name}' to {phone_number}: {e}"
        )
        raise


def send_push_notification(notification_id):
    # This is a placeholder. You would integrate with a push notification service like Firebase Cloud Messaging (FCM) here.
    try:
        notification = Notification.objects.get(id=notification_id)
        logger.info(f"--- SIMULATING PUSH NOTIFICATION ---")
        logger.info(f"TO: {notification.target}")
        logger.info(f"TITLE: {notification.title}")
        logger.info(f"BODY: {notification.message}")
        logger.info(f"--- END SIMULATING PUSH NOTIFICATION ---")
        notification.status = Notification.Status.SENT
        notification.sent_at = timezone.now()
        notification.save()
        logger.info(
            f"Push notification {notification_id} sent successfully (simulated)."
        )
    except Notification.DoesNotExist:
        logger.error(f"Notification with id {notification_id} does not exist.")
    except Exception as e:
        logger.error(f"Failed to send push notification {notification_id}: {e}")
        if "notification" in locals():
            notification.status = Notification.Status.FAILED
            notification.save()


def send_in_app_notification(notification_id):
    """
    Send an in-app notification via WebSocket.
    This pushes the notification to the user's browser in real-time.
    """
    try:
        notification = Notification.objects.get(id=notification_id)
        channel_layer = get_channel_layer()
        room_group_name = f"user_{notification.recipient.id}_wallet"

        # Send the notification data to the user's WebSocket group
        async_to_sync(channel_layer.group_send)(
            room_group_name,
            {
                "type": "wallet_update",
                "data": {
                    "type": "notification",
                    "notification": {
                        "id": notification.id,
                        "title": notification.title,
                        "message": notification.message,
                        "is_read": notification.is_read,
                        "created_at": notification.created_at.isoformat(),
                    },
                },
            },
        )

        notification.status = Notification.Status.SENT
        notification.sent_at = timezone.now()
        notification.save()
        logger.info(f"In-app notification {notification_id} sent successfully.")
    except Notification.DoesNotExist:
        logger.error(f"Notification with id {notification_id} does not exist.")
    except Exception as e:
        logger.error(f"Failed to send in-app notification {notification_id}: {e}")
        if "notification" in locals():
            notification.status = Notification.Status.FAILED
            notification.save()


def create_in_app_notification(user, title, message):
    """
    Helper function to create and send an in-app notification.
    This creates the notification record and triggers the WebSocket push.
    """
    # Import tasks locally to avoid circular import (tasks module imports this module)
    from . import tasks

    notification = Notification.objects.create(
        recipient=user,
        channel=Notification.Channel.IN_APP,
        target=f"user_{user.id}",
        title=title,
        message=message,
    )
    tasks.send_in_app_task.delay(notification.id)
    return notification
