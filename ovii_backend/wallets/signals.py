from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import Transaction


@receiver(post_save, sender=Transaction)
def broadcast_transaction_update(sender, instance: Transaction, created: bool, **kwargs):
    """
    Broadcasts a wallet update to the sender and recipient
    of a transaction after it has been created.
    """
    if not created:
        return

    channel_layer = get_channel_layer()

    # Prepare a detailed payload for the frontend.
    # This gives the client enough information to react, e.g., show a notification
    # and trigger a data refresh.
    payload = {
        'type': 'wallet.update',  # This corresponds to the consumer method name
        'data': {
            'message': f'A transaction of {instance.source_wallet.currency} {instance.amount} was {instance.get_status_display().lower()}.',
            'transaction_id': str(instance.id),
            'status': instance.status,
            'amount': str(instance.amount),
            'currency': instance.source_wallet.currency,
        }
    }

    # Get the user IDs for the source and destination wallets.
    # Using a set automatically handles any cases where a user might be both,
    # preventing duplicate notifications.
    user_ids_to_notify = {
        instance.source_wallet.user_id,
        instance.destination_wallet.user_id
    }

    # Notify both the sender and the recipient via their user-specific WebSocket group.
    for user_id in user_ids_to_notify:
        if user_id:  # Ensure user_id is not None
            group_name = f'user_{user_id}_wallet'
            async_to_sync(channel_layer.group_send)(group_name, payload)
