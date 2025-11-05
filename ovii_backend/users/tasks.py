"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-20
Description: Defines Celery tasks for the users app.
"""

from celery import shared_task
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import secrets
import logging
from .models import OTPRequest, OviiUser
from wallets.models import Wallet

# Get the custom logger
logger = logging.getLogger("users.otp")


@shared_task
def generate_and_log_otp(phone_number):
    """
    Generates a 6-digit OTP, saves it, and logs it for development.
    In production, this task would be responsible for sending an email or SMS.
    """
    code = str(secrets.randbelow(900000) + 100000)  # 6-digit OTP
    otp_request = OTPRequest.objects.create(phone_number=phone_number, code=code)

    # Log the OTP to the console for development purposes.
    logger.info(
        f"OTP for {phone_number}: {code} (Request ID: {otp_request.request_id})"
    )

    return str(otp_request.request_id)


@shared_task
def create_user_wallet(user_id: int):
    """
    Creates a wallet for a new user and sends a welcome notification.
    This is designed to be called after a user's account is activated.
    """
    try:
        user = OviiUser.objects.get(id=user_id)
        # The get_or_create method prevents race conditions or duplicate wallets.
        Wallet.objects.get_or_create(user=user)
        logger.info(f"Wallet created successfully for user {user_id}")
        send_welcome_notification.delay(user_id)
    except OviiUser.DoesNotExist:
        logger.error(f"Attempted to create wallet for non-existent user ID: {user_id}")


@shared_task
def send_welcome_notification(user_id: int):
    """
    Sends a welcome notification to a user via WebSocket after successful registration.

    This task is executed asynchronously by a Celery worker. It retrieves the
    channel layer and sends a message to the user's private notification group.
    """
    channel_layer = get_channel_layer()
    room_group_name = f"user_{user_id}_notifications"
    message = {
        "type": "user.notification",
        "message": "Welcome to Ovii! Thank you for registering.",
    }
    async_to_sync(channel_layer.group_send)(room_group_name, message)
    return f"Welcome notification sent to user {user_id}"


@shared_task
def send_realtime_notification(user_id: int, message: str):
    """
    Sends a real-time notification to a specific user via WebSocket.
    """
    channel_layer = get_channel_layer()
    room_group_name = f"user_{user_id}_notifications"
    event = {
        "type": "user.notification",  # This corresponds to the consumer method name
        "message": message,
    }
    async_to_sync(channel_layer.group_send)(room_group_name, event)
    return f"Notification sent to user {user_id}: '{message}'"
