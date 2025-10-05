"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: Defines signal handlers for the wallets app.
"""
from django.dispatch import receiver
from users.tasks import send_realtime_notification
from .signals import transaction_completed
from merchants.tasks import send_payment_webhook
from .models import Transaction


@receiver(transaction_completed, sender=Transaction)
def handle_transaction_completed(sender, **kwargs):
    """
    Sends notifications to the sender and receiver when a transaction is completed.
    """
    transaction = kwargs.get('transaction')
    if not transaction:
        return

    tx_type = transaction.transaction_type
    sender_user = transaction.wallet.user
    receiver_user = transaction.related_wallet.user if transaction.related_wallet else None
    amount = transaction.amount
    currency = transaction.wallet.currency

    # --- User-facing WebSocket Notifications ---
    if tx_type == Transaction.TransactionType.TRANSFER and receiver_user:
        sender_msg = f"You sent {amount} {currency} to {receiver_user.get_full_name() or receiver_user.phone_number}."
        receiver_msg = f"You received {amount} {currency} from {sender_user.get_full_name() or sender_user.phone_number}."
        send_realtime_notification.delay(sender_user.id, sender_msg)
        send_realtime_notification.delay(receiver_user.id, receiver_msg)

    elif tx_type == Transaction.TransactionType.DEPOSIT and receiver_user: # Agent Cash-in
        agent_msg = f"You deposited {amount} {currency} into {receiver_user.get_full_name() or receiver_user.phone_number}'s wallet."
        customer_msg = f"An agent deposited {amount} {currency} into your wallet."
        send_realtime_notification.delay(sender_user.id, agent_msg) # Notification to Agent
        send_realtime_notification.delay(receiver_user.id, customer_msg) # Notification to Customer

    elif tx_type == Transaction.TransactionType.WITHDRAWAL and receiver_user: # Customer Cash-out
        customer_msg = f"You cashed out {amount} {currency} with agent {receiver_user.agent_profile.agent_code}."
        agent_msg = f"You received a cash-out payment of {amount} {currency} from {sender_user.get_full_name() or sender_user.phone_number}."
        send_realtime_notification.delay(sender_user.id, customer_msg) # Notification to Customer
        send_realtime_notification.delay(receiver_user.id, agent_msg) # Notification to Agent

    # --- Webhook for Merchant Payments ---
    # If the transaction is a payment and the receiver is a merchant, trigger a webhook.
    if transaction.transaction_type == Transaction.TransactionType.PAYMENT:
        if hasattr(receiver_user, 'merchant_profile'):
            send_payment_webhook.delay(transaction.id)