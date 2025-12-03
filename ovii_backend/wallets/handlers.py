"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: Defines signal handlers for the wallets app.
"""

import logging
from django.dispatch import receiver
from users.tasks import send_realtime_notification
from .signals import transaction_completed
from merchants.tasks import send_payment_webhook
from .models import Transaction
from notifications.models import Notification
from notifications.tasks import send_email_task, send_sms_task, send_push_task

logger = logging.getLogger(__name__)


def _create_and_send_notification(user, title, message):
    """
    Helper function to create notification records and trigger email, SMS, and push.
    Each notification channel is wrapped in try-except to ensure one failure doesn't
    prevent other notifications from being sent.
    """
    # Create Email notification if user has email
    if user.email:
        try:
            email_notification = Notification.objects.create(
                recipient=user,
                channel=Notification.Channel.EMAIL,
                target=user.email,
                title=title,
                message=message,
            )
            send_email_task.delay(email_notification.id)
        except Exception as e:
            logger.error(f"Failed to create/send email notification for user {user.id}: {e}")

    # Create SMS notification
    if user.phone_number:
        try:
            sms_notification = Notification.objects.create(
                recipient=user,
                channel=Notification.Channel.SMS,
                target=str(user.phone_number),
                title=title,
                message=message,
            )
            send_sms_task.delay(sms_notification.id)
        except Exception as e:
            logger.error(f"Failed to create/send SMS notification for user {user.id}: {e}")

    # Create Push notification
    # Note: In production, this should use actual device tokens from FCM/APNs.
    # Currently using user ID as a placeholder for the simulated push service.
    try:
        push_notification = Notification.objects.create(
            recipient=user,
            channel=Notification.Channel.PUSH,
            target=f"user_{user.id}",  # Placeholder - replace with actual device token in production
            title=title,
            message=message,
        )
        send_push_task.delay(push_notification.id)
    except Exception as e:
        logger.error(f"Failed to create/send push notification for user {user.id}: {e}")


@receiver(transaction_completed, sender=Transaction)
def handle_transaction_completed(sender, **kwargs):
    """
    Sends notifications to the sender and receiver when a transaction is completed.
    Sends via WebSocket (real-time), Email, SMS, and Push notifications.
    """
    transaction = kwargs.get("transaction")
    if not transaction:
        return

    tx_type = transaction.transaction_type
    sender_user = transaction.wallet.user
    receiver_user = (
        transaction.related_wallet.user if transaction.related_wallet else None
    )
    amount = transaction.amount
    currency = transaction.wallet.currency

    # --- User-facing WebSocket Notifications ---
    if tx_type == Transaction.TransactionType.TRANSFER and receiver_user:
        sender_msg = f"You sent {amount} {currency} to {receiver_user.get_full_name() or receiver_user.phone_number}."
        receiver_msg = f"You received {amount} {currency} from {sender_user.get_full_name() or sender_user.phone_number}."
        
        # Real-time WebSocket notifications
        send_realtime_notification.delay(sender_user.id, sender_msg)
        send_realtime_notification.delay(receiver_user.id, receiver_msg)
        
        # Email, SMS, and Push notifications
        _create_and_send_notification(sender_user, "Transfer Sent", sender_msg)
        _create_and_send_notification(receiver_user, "Money Received", receiver_msg)

    elif (
        tx_type == Transaction.TransactionType.DEPOSIT and receiver_user
    ):  # Agent Cash-in
        agent_msg = f"You deposited {amount} {currency} into {receiver_user.get_full_name() or receiver_user.phone_number}'s wallet."
        customer_msg = f"An agent deposited {amount} {currency} into your wallet."
        
        # Real-time WebSocket notifications
        send_realtime_notification.delay(sender_user.id, agent_msg)
        send_realtime_notification.delay(receiver_user.id, customer_msg)
        
        # Email, SMS, and Push notifications
        _create_and_send_notification(sender_user, "Deposit Completed", agent_msg)
        _create_and_send_notification(receiver_user, "Money Deposited", customer_msg)

    elif (
        tx_type == Transaction.TransactionType.WITHDRAWAL and receiver_user
    ):  # Customer Cash-out
        agent_code = getattr(getattr(receiver_user, "agent_profile", None), "agent_code", None) or "Unknown Agent"
        customer_msg = f"You cashed out {amount} {currency} with agent {agent_code}."
        agent_msg = f"You received a cash-out payment of {amount} {currency} from {sender_user.get_full_name() or sender_user.phone_number}."
        
        # Real-time WebSocket notifications
        send_realtime_notification.delay(sender_user.id, customer_msg)
        send_realtime_notification.delay(receiver_user.id, agent_msg)
        
        # Email, SMS, and Push notifications
        _create_and_send_notification(sender_user, "Cash-out Successful", customer_msg)
        _create_and_send_notification(receiver_user, "Cash-out Received", agent_msg)

    # --- Commission Transaction Notifications ---
    elif tx_type == Transaction.TransactionType.COMMISSION:
        # Notify the user whose wallet was charged the commission
        commission_msg = f"A commission of {amount} {currency} was deducted from your wallet."
        send_realtime_notification.delay(sender_user.id, commission_msg)
        _create_and_send_notification(sender_user, "Commission Charged", commission_msg)

    # --- Webhook for Merchant Payments ---
    # If the transaction is a payment and the receiver is a merchant, trigger a webhook.
    if transaction.transaction_type == Transaction.TransactionType.PAYMENT:
        if hasattr(receiver_user, "merchant_profile"):
            send_payment_webhook.delay(transaction.id)
