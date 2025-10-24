from django.core.mail import send_mail
from django.conf import settings
from .models import Notification

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
        notification.save()
        logger.info(f"Email notification {notification_id} sent successfully.")
    except Notification.DoesNotExist:
        logger.error(f"Notification with id {notification_id} does not exist.")
    except Exception as e:
        logger.error(f"Failed to send email notification {notification_id}: {e}")
        if 'notification' in locals():
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
        notification.save()
        logger.info(f"SMS notification {notification_id} sent successfully (simulated).")
    except Notification.DoesNotExist:
        logger.error(f"Notification with id {notification_id} does not exist.")
    except Exception as e:
        logger.error(f"Failed to send SMS notification {notification_id}: {e}")
        if 'notification' in locals():
            notification.status = Notification.Status.FAILED
            notification.save()

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
        notification.save()
        logger.info(f"Push notification {notification_id} sent successfully (simulated).")
    except Notification.DoesNotExist:
        logger.error(f"Notification with id {notification_id} does not exist.")
    except Exception as e:
        logger.error(f"Failed to send push notification {notification_id}: {e}")
        if 'notification' in locals():
            notification.status = Notification.Status.FAILED
            notification.save()
