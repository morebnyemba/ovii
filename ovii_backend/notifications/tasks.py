from celery import shared_task
from . import services

@shared_task
def send_email_task(notification_id):
    services.send_email_notification(notification_id)

@shared_task
def send_sms_task(notification_id):
    services.send_sms_notification(notification_id)

@shared_task
def send_push_task(notification_id):
    services.send_push_notification(notification_id)
