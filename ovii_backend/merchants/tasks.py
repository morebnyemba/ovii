"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: Defines Celery tasks for the merchants app, like sending webhooks.
"""
import requests
from celery import shared_task
from wallets.models import Transaction
from wallets.serializers import TransactionSerializer
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=60) # Retry 3 times, with a 1-minute delay
def send_payment_webhook(self, transaction_id: int):
    """
    Sends a webhook notification to a merchant upon successful payment completion.
    """
    try:
        transaction = Transaction.objects.select_related(
            'related_wallet__user__merchant_profile'
        ).get(id=transaction_id)

        merchant_profile = getattr(transaction.related_wallet.user, 'merchant_profile', None)

        if not (merchant_profile and merchant_profile.webhook_url):
            logger.info(f"No webhook URL for merchant on transaction {transaction_id}. Skipping.")
            return "No webhook URL configured. Task finished."

        payload = TransactionSerializer(transaction).data
        headers = {'Content-Type': 'application/json'}

        response = requests.post(merchant_profile.webhook_url, json=payload, timeout=10)
        response.raise_for_status() # Raise an exception for 4xx or 5xx status codes

        logger.info(f"Successfully sent webhook for transaction {transaction_id} to {merchant_profile.webhook_url}")
        return f"Webhook sent for transaction {transaction_id}"

    except Transaction.DoesNotExist:
        logger.error(f"Transaction with ID {transaction_id} not found for webhook task.")
    except requests.RequestException as exc:
        logger.warning(f"Webhook for transaction {transaction_id} failed. Retrying... Error: {exc}")
        raise self.retry(exc=exc)