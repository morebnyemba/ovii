"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: API views for handling third-party integrations.
"""

from rest_framework import generics, status, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from decimal import Decimal
from django.db import transaction
from django.conf import settings
import logging

from wallets.models import Transaction, Wallet
from wallets.permissions import IsMobileVerifiedOrHigher
from wallets.services import (
    create_transaction,
    TransactionError,
    TransactionLimitExceededError,
)
from users.models import OviiUser
from users.tasks import send_realtime_notification
from .services import EcoCashClient, PaynowClient
from .tasks import process_ecocash_withdrawal
from .serializers import (
    PaynowTopUpRequestSerializer,
)  # This import will now work correctly


class EcoCashWithdrawalSerializer(serializers.Serializer):
    amount = serializers.DecimalField(
        max_digits=12, decimal_places=2, min_value=Decimal("1.00")
    )
    pin = serializers.CharField(
        write_only=True, style={"input_type": "password"}, min_length=4, max_length=4
    )

    def validate(self, data):
        user = self.context["request"].user
        if not user.has_set_pin:
            raise serializers.ValidationError(
                {"pin": "You must set a transaction PIN before making a withdrawal."}
            )
        if not user.check_pin(data["pin"]):
            raise serializers.ValidationError({"pin": "Incorrect transaction PIN."})
        return data


class EcoCashWithdrawalView(generics.GenericAPIView):
    """
    Endpoint for a user to withdraw funds from their Ovii wallet to their EcoCash account.
    """

    serializer_class = EcoCashWithdrawalSerializer
    permission_classes = [IsAuthenticated, IsMobileVerifiedOrHigher]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        amount = serializer.validated_data["amount"]

        # Trigger the asynchronous withdrawal process
        process_ecocash_withdrawal.delay(user.id, str(amount))

        return Response(
            {
                "detail": "Your withdrawal request is being processed. You will receive a notification shortly."
            },
            status=status.HTTP_202_ACCEPTED,
        )


class PaynowTopUpRequestView(generics.GenericAPIView):
    """
    Endpoint for a user to request a wallet top-up via Paynow.
    """

    serializer_class = PaynowTopUpRequestSerializer
    permission_classes = [IsAuthenticated, IsMobileVerifiedOrHigher]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        amount = serializer.validated_data["amount"]

        pending_tx = Transaction.objects.create(
            wallet=user.wallet,
            transaction_type=Transaction.TransactionType.DEPOSIT,
            amount=amount,
            status=Transaction.Status.PENDING,
            description=f"Paynow top-up request for {user.phone_number}",
        )

        try:
            client = PaynowClient()
            response_data = client.create_transaction(
                reference=str(pending_tx.id),
                amount=amount,
                user_email=user.email or "customer@ovii.com",
            )
            return Response(response_data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logging.error(f"Paynow top-up initiation failed for user {user.id}: {e}")
            pending_tx.status = Transaction.Status.FAILED
            pending_tx.save()
            
            # Send WhatsApp notification for failed deposit
            if user.phone_number:
                try:
                    from notifications.services import send_whatsapp_template
                    send_whatsapp_template(
                        phone_number=str(user.phone_number),
                        template_name="deposit_failed",
                        variables={
                            "amount": str(amount),
                            "currency": user.wallet.currency,
                            "reason": "Payment gateway error",
                            "transaction_id": str(pending_tx.id)
                        }
                    )
                except Exception as whatsapp_error:
                    logging.error(f"Failed to send WhatsApp deposit failure notification: {whatsapp_error}")
            
            return Response(
                {"detail": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE
            )


class PaynowWebhookView(APIView):
    """
    Receives webhook notifications from Paynow for transaction status updates.
    """

    permission_classes = []  # Publicly accessible

    def post(self, request, *args, **kwargs):
        data = request.data
        transaction_id = data.get("reference")
        paynow_reference = data.get("paynowreference")
        payment_status = data.get("status", "").lower()

        try:
            tx_to_update = Transaction.objects.select_related("wallet__user").get(
                id=transaction_id, status=Transaction.Status.PENDING
            )
        except Transaction.DoesNotExist:
            logging.warning(
                f"Paynow webhook received for unknown or already processed transaction: {transaction_id}"
            )
            return Response(status=status.HTTP_404_NOT_FOUND)

        if payment_status == "paid":
            with transaction.atomic():
                wallet_locked = Wallet.objects.select_for_update().get(
                    pk=tx_to_update.wallet.pk
                )
                wallet_locked.balance += tx_to_update.amount
                wallet_locked.save(update_fields=["balance", "updated_at"])

                tx_to_update.status = Transaction.Status.COMPLETED
                tx_to_update.description = (
                    f"Paynow top-up successful. Ref: {paynow_reference}"
                )
                tx_to_update.save()
                send_realtime_notification.delay(
                    tx_to_update.wallet.user.id,
                    f"Your wallet has been topped up with ${tx_to_update.amount}.",
                )
        else:
            tx_to_update.status = Transaction.Status.FAILED
            tx_to_update.description = f"Paynow top-up failed. Status: {payment_status}. Ref: {paynow_reference}"
            tx_to_update.save()
            
            # Send real-time notification
            send_realtime_notification.delay(
                tx_to_update.wallet.user.id,
                f"Your wallet top-up of ${tx_to_update.amount} failed.",
            )
            
            # Send WhatsApp notification for failed deposit
            user = tx_to_update.wallet.user
            if user.phone_number:
                try:
                    from notifications.services import send_whatsapp_template
                    send_whatsapp_template(
                        phone_number=str(user.phone_number),
                        template_name="deposit_failed",
                        variables={
                            "amount": str(tx_to_update.amount),
                            "currency": tx_to_update.wallet.currency,
                            "reason": f"Payment status: {payment_status}",
                            "transaction_id": str(tx_to_update.id)
                        }
                    )
                except Exception as e:
                    logging.error(f"Failed to send WhatsApp deposit failure notification: {e}")

        return Response(status=status.HTTP_200_OK)
