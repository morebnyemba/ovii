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
from .models import OTPRequest, OviiUser, Referral
from wallets.models import Wallet

# Get the custom logger
logger = logging.getLogger("users.otp")


@shared_task
def generate_and_log_otp(phone_number):
    """
    Generates a 6-digit OTP, saves it, and sends it via WhatsApp.
    Falls back to logging if WhatsApp is not configured.
    """
    code = str(secrets.randbelow(900000) + 100000)  # 6-digit OTP
    otp_request = OTPRequest.objects.create(phone_number=phone_number, code=code)

    # Log the OTP to the console for development/debugging purposes.
    logger.info(
        f"OTP for {phone_number}: {code} (Request ID: {otp_request.request_id})"
    )

    # Send OTP via WhatsApp
    try:
        from notifications.services import send_whatsapp_template

        send_whatsapp_template(
            phone_number=phone_number,
            template_name="otp_verification",
            variables={"code": code},
        )
        logger.info(f"OTP sent via WhatsApp to {phone_number}")
    except Exception as e:
        logger.error(f"Failed to send OTP via WhatsApp to {phone_number}: {e}")
        # Continue execution even if WhatsApp fails - OTP is still logged

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
    Sends a welcome notification to a user via WebSocket and WhatsApp after successful registration.

    This task is executed asynchronously by a Celery worker. It retrieves the
    channel layer and sends a message to the user's private notification group,
    and also sends a WhatsApp template message.
    """
    try:
        user = OviiUser.objects.get(id=user_id)
        
        # Send WebSocket notification
        channel_layer = get_channel_layer()
        room_group_name = f"user_{user_id}_notifications"
        message = {
            "type": "user.notification",
            "message": "Welcome to Ovii! Thank you for registering.",
        }
        async_to_sync(channel_layer.group_send)(room_group_name, message)
        
        # Send WhatsApp template notification
        if user.phone_number:
            try:
                from notifications.services import send_whatsapp_template
                
                # Get user's first name, fallback to phone number if no name
                user_name = user.first_name if user.first_name else str(user.phone_number)
                
                send_whatsapp_template(
                    phone_number=str(user.phone_number),
                    template_name="welcome_message",
                    variables={
                        "user_name": user_name,
                    },
                )
                logger.info(f"Welcome WhatsApp template sent to user {user_id}")
            except Exception as e:
                logger.error(f"Failed to send welcome WhatsApp template to user {user_id}: {e}")
        
        return f"Welcome notification sent to user {user_id}"
    except OviiUser.DoesNotExist:
        logger.error(f"User {user_id} not found for welcome notification")
        return f"User {user_id} not found"


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


@shared_task
def process_referral_bonus(referral_id: int):
    """
    Processes a referral bonus asynchronously.

    This task credits the referral bonuses to both the referrer and referred user
    after the referred user has completed their onboarding (e.g., set up their PIN).

    Args:
        referral_id: The ID of the Referral to process.
    """
    from .services import credit_referral_bonuses, ReferralBonusError

    try:
        referral = credit_referral_bonuses(referral_id)

        # Send real-time notifications to both users
        send_realtime_notification.delay(
            referral.referrer.id,
            f"You earned {referral.referrer_bonus} {referral.referrer.wallet.currency} for referring a friend!",
        )
        send_realtime_notification.delay(
            referral.referred.id,
            f"You received a {referral.referred_bonus} {referral.referred.wallet.currency} welcome bonus!",
        )

        # Send WhatsApp notifications to referrer
        if referral.referrer.phone_number:
            try:
                from notifications.services import send_whatsapp_template

                send_whatsapp_template(
                    phone_number=str(referral.referrer.phone_number),
                    template_name="referral_bonus_credited",
                    variables={
                        "bonus_amount_with_currency": f"{referral.referrer_bonus} {referral.referrer.wallet.currency}",
                        "new_balance_with_currency": f"{referral.referrer.wallet.balance} {referral.referrer.wallet.currency}",
                    },
                )
            except Exception as e:
                logger.error(
                    f"Failed to send WhatsApp referral notification to referrer {referral.referrer.phone_number}: {e}"
                )

        # Send WhatsApp notifications to referred user
        if referral.referred.phone_number:
            try:
                from notifications.services import send_whatsapp_template

                send_whatsapp_template(
                    phone_number=str(referral.referred.phone_number),
                    template_name="referral_bonus_credited",
                    variables={
                        "bonus_amount_with_currency": f"{referral.referred_bonus} {referral.referred.wallet.currency}",
                        "new_balance_with_currency": f"{referral.referred.wallet.balance} {referral.referred.wallet.currency}",
                    },
                )
            except Exception as e:
                logger.error(
                    f"Failed to send WhatsApp referral notification to referred user {referral.referred.phone_number}: {e}"
                )

        logger.info(f"Referral {referral_id} bonus processed successfully.")
        return f"Referral {referral_id} bonus processed successfully."
    except ReferralBonusError as e:
        logger.error(f"Failed to process referral {referral_id}: {e}")
        return f"Failed to process referral {referral_id}: {e}"
    except Exception as e:
        logger.error(f"Unexpected error processing referral {referral_id}: {e}")
        raise  # Re-raise for Celery retry logic


@shared_task
def process_pending_referral_bonuses():
    """
    Batch task to process all pending referral bonuses for eligible users.

    This task is designed to be run periodically (e.g., via Celery Beat) to
    automatically credit referral bonuses when users become eligible.
    """
    from .services import check_referral_eligibility

    pending_referrals = Referral.objects.filter(
        bonus_status=Referral.BonusStatus.PENDING
    ).select_related("referred")

    processed_count = 0
    for referral in pending_referrals:
        if check_referral_eligibility(referral.referred):
            process_referral_bonus.delay(referral.id)
            processed_count += 1

    logger.info(f"Queued {processed_count} referral bonuses for processing.")
    return f"Queued {processed_count} referral bonuses for processing."
