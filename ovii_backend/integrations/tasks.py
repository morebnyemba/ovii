"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: Defines Celery tasks for the integrations app.
"""
from celery import shared_task
from django.conf import settings
from decimal import Decimal
import logging

from users.models import OviiUser
from users.tasks import send_realtime_notification
from wallets.models import Wallet, Transaction
from wallets.services import create_transaction, TransactionError, TransactionLimitExceededError
from .services import EcoCashClient

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=300) # Retry 3 times, 5 min delay
def process_ecocash_withdrawal(self, user_id: int, amount_str: str):
    """
    Orchestrates the withdrawal from a user's wallet to their EcoCash account.
    """
    try:
        user = OviiUser.objects.get(id=user_id)
        amount = Decimal(amount_str)
        payout_system_user = OviiUser.objects.get(phone_number=settings.SYSTEM_PAYOUT_WALLET_PHONE)
    except OviiUser.DoesNotExist:
        logger.error(f"User with ID {user_id} or system payout user not found for withdrawal.")
        return

    # 1. Atomically move funds from user wallet to system payout wallet
    try:
        internal_tx = create_transaction(
            sender_wallet=user.wallet,
            receiver_wallet=payout_system_user.wallet,
            amount=amount,
            transaction_type=Transaction.TransactionType.WITHDRAWAL,
            description=f"Pending EcoCash withdrawal for {user.phone_number}"
        )
    except (TransactionError, TransactionLimitExceededError) as e:
        logger.error(f"Failed to debit user {user_id} for withdrawal: {e}")
        send_realtime_notification.delay(user_id, f"Your withdrawal of ${amount} failed due to: {e}")
        return

    # 2. Attempt to send funds via EcoCash API
    try:
        client = EcoCashClient()
        client.send_b2c_payment(
            phone_number=str(user.phone_number),
            amount=amount,
            reference=str(internal_tx.id)
        )
        logger.info(f"Successfully initiated EcoCash B2C payment for transaction {internal_tx.id}")
        send_realtime_notification.delay(user_id, f"Your withdrawal of ${amount} to EcoCash has been processed successfully.")

    except Exception as exc:
        logger.error(f"EcoCash B2C payment failed for transaction {internal_tx.id}. Reverting funds.")
        # 3. If API call fails, revert the funds
        try:
            create_transaction(
                sender_wallet=payout_system_user.wallet,
                receiver_wallet=user.wallet,
                amount=amount,
                transaction_type=Transaction.TransactionType.DEPOSIT, # This is a reversal/refund
                description=f"Reversal for failed withdrawal TXN ID: {internal_tx.id}"
            )
            send_realtime_notification.delay(user_id, f"Your withdrawal of ${amount} failed and the funds have been returned to your wallet.")
        except Exception as revert_exc:
            # Critical error: funds are in suspense. Needs manual intervention.
            logger.critical(f"CRITICAL: FAILED TO REVERT FUNDS for user {user_id}, amount ${amount}, TXN ID {internal_tx.id}. Error: {revert_exc}")
        raise self.retry(exc=exc)