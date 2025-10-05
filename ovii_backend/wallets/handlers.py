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

    sender_user = transaction.wallet.user
    receiver_user = transaction.related_wallet.user if transaction.related_wallet else None
    amount = transaction.amount
    currency = transaction.wallet.currency

    # Send notification to sender
    if receiver_user:
        send_realtime_notification.delay(sender_user.id, f"You have sent {amount} {currency} to {receiver_user.get_full_name() or receiver_user.phone_number}.")
    # Send notification to receiver
    if receiver_user:
        send_realtime_notification.delay(receiver_user.id, f"You have received {amount} {currency} from {sender_user.get_full_name() or sender_user.phone_number}.")

    # --- Webhook for Merchant Payments ---
    # If the transaction is a payment and the receiver is a merchant, trigger a webhook.
    if transaction.transaction_type == Transaction.TransactionType.PAYMENT:
        if hasattr(receiver_user, 'merchant_profile'):
            send_payment_webhook.delay(transaction.id)