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
from notifications.tasks import send_email_task, send_sms_task, send_push_task, send_in_app_task, send_whatsapp_task

logger = logging.getLogger(__name__)


def _send_whatsapp_template_notification(user, template_name, variables):
    """
    Helper function to send WhatsApp template notifications.
    This uses WhatsApp approved templates instead of plain text messages.
    """
    if not user.phone_number:
        return
    
    try:
        from notifications.services import send_whatsapp_template
        
        send_whatsapp_template(
            phone_number=str(user.phone_number),
            template_name=template_name,
            variables=variables,
        )
        logger.info(f"WhatsApp template '{template_name}' sent to user {user.id}")
    except Exception as e:
        logger.error(f"Failed to send WhatsApp template '{template_name}' to user {user.id}: {e}")


def _create_and_send_notification(user, title, message):
    """
    Helper function to create notification records and trigger email, SMS, push, and in-app.
    Each notification channel is wrapped in try-except to ensure one failure doesn't
    prevent other notifications from being sent.
    """
    # Create In-App notification (for the notification dropdown)
    try:
        in_app_notification = Notification.objects.create(
            recipient=user,
            channel=Notification.Channel.IN_APP,
            target=f"user_{user.id}",
            title=title,
            message=message,
        )
        send_in_app_task.delay(in_app_notification.id)
    except Exception as e:
        logger.error(f"Failed to create/send in-app notification for user {user.id}: {e}")

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

    # Create WhatsApp notification (preferred over SMS)
    if user.phone_number:
        try:
            whatsapp_notification = Notification.objects.create(
                recipient=user,
                channel=Notification.Channel.WHATSAPP,
                target=str(user.phone_number),
                title=title,
                message=message,
            )
            send_whatsapp_task.delay(whatsapp_notification.id)
        except Exception as e:
            logger.error(f"Failed to create/send WhatsApp notification for user {user.id}: {e}")

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
    
    # Refresh wallet instances from the database to get updated balances
    # This is crucial because the transaction object has cached wallet objects
    # from before the balance was updated
    # Only refresh the balance field to minimize database query overhead
    transaction.wallet.refresh_from_db(fields=['balance'])
    if transaction.related_wallet:
        transaction.related_wallet.refresh_from_db(fields=['balance'])

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
        
        # WhatsApp Template notifications
        # Send template to sender
        _send_whatsapp_template_notification(
            sender_user,
            "transaction_sent",
            {
                "amount_with_currency": f"{amount} {currency}",
                "recipient_name": receiver_user.get_full_name() or str(receiver_user.phone_number),
                "new_balance_with_currency": f"{transaction.wallet.balance} {currency}",
                "transaction_id": transaction.transaction_reference,
            }
        )
        
        # Send template to receiver
        _send_whatsapp_template_notification(
            receiver_user,
            "transaction_received",
            {
                "amount_with_currency": f"{amount} {currency}",
                "sender_name": sender_user.get_full_name() or str(sender_user.phone_number),
                "new_balance_with_currency": f"{transaction.related_wallet.balance} {currency}",
                "transaction_id": transaction.transaction_reference,
            }
        )

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
        
        # WhatsApp Template notification for customer (deposit confirmed)
        _send_whatsapp_template_notification(
            receiver_user,
            "deposit_confirmed",
            {
                "amount_with_currency": f"{amount} {currency}",
                "new_balance_with_currency": f"{transaction.related_wallet.balance} {currency}",
                "transaction_id": transaction.transaction_reference,
            }
        )

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
        
        # WhatsApp Template notification for customer (withdrawal processed)
        _send_whatsapp_template_notification(
            sender_user,
            "withdrawal_processed",
            {
                "amount_with_currency": f"{amount} {currency}",
                "new_balance_with_currency": f"{transaction.wallet.balance} {currency}",
                "transaction_id": transaction.transaction_reference,
            }
        )

    # --- Commission Transaction Notifications ---
    elif tx_type == Transaction.TransactionType.COMMISSION:
        # Notify the user whose wallet was charged the commission
        commission_msg = f"A commission of {amount} {currency} was deducted from your wallet."
        send_realtime_notification.delay(sender_user.id, commission_msg)
        _create_and_send_notification(sender_user, "Commission Charged", commission_msg)

    # --- Webhook for Merchant Payments ---
    # If the transaction is a payment and the receiver is a merchant, trigger a webhook.
    if transaction.transaction_type == Transaction.TransactionType.PAYMENT:
        if hasattr(receiver_user, "merchant_profile") and receiver_user:
            send_payment_webhook.delay(transaction.id)
            
            # Send WhatsApp template notifications for merchant payments
            # Customer notification (payment sent)
            _send_whatsapp_template_notification(
                sender_user,
                "payment_sent",
                {
                    "amount_with_currency": f"{amount} {currency}",
                    "merchant_name": receiver_user.get_full_name() or str(receiver_user.phone_number),
                    "new_balance_with_currency": f"{transaction.wallet.balance} {currency}",
                    "transaction_id": transaction.transaction_reference,
                }
            )
            
            # Merchant notification (payment received)
            _send_whatsapp_template_notification(
                receiver_user,
                "payment_received",
                {
                    "amount_with_currency": f"{amount} {currency}",
                    "customer_name": sender_user.get_full_name() or str(sender_user.phone_number),
                    "new_balance_with_currency": f"{transaction.related_wallet.balance} {currency}",
                    "transaction_id": transaction.transaction_reference,
                }
            )
