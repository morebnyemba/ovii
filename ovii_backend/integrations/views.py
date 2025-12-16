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
from users.tasks import send_realtime_notification
from .services import PaynowClient
from .tasks import process_ecocash_withdrawal
from .serializers import (
    PaynowTopUpRequestSerializer,
)  # This import will now work correctly
from .models import WhatsAppConfig


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
                            "transaction_id": str(pending_tx.id),
                        },
                    )
                except Exception as whatsapp_error:
                    logging.error(
                        f"Failed to send WhatsApp deposit failure notification: {whatsapp_error}"
                    )

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
                            "transaction_id": str(tx_to_update.id),
                        },
                    )
                except Exception as e:
                    logging.error(
                        f"Failed to send WhatsApp deposit failure notification: {e}"
                    )

        return Response(status=status.HTTP_200_OK)


class WhatsAppWebhookView(APIView):
    """
    Webhook endpoint for WhatsApp Business Cloud API.
    
    This endpoint:
    1. Verifies webhook during Meta setup (GET request)
    2. Receives webhook notifications from Meta (POST request)
    
    Setup in Meta Business Manager:
    - Webhook URL: https://yourdomain.com/api/integrations/webhooks/whatsapp/
    - Verify Token: Set in WHATSAPP_WEBHOOK_VERIFY_TOKEN env var or WhatsAppConfig
    - Subscribe to: messages, message_status (recommended)
    """

    permission_classes = []  # Publicly accessible

    def get(self, request, *args, **kwargs):
        """
        Webhook verification endpoint (required by Meta).
        
        Meta will make a GET request during webhook setup with:
        - hub.mode: 'subscribe'
        - hub.verify_token: Your verification token
        - hub.challenge: Random string to echo back
        """
        mode = request.query_params.get("hub.mode")
        token = request.query_params.get("hub.verify_token")
        challenge = request.query_params.get("hub.challenge")

        # Get verify token from database or environment
        verify_token = None
        try:
            config = WhatsAppConfig.objects.filter(is_active=True).first()
            if config:
                verify_token = config.webhook_verify_token
        except Exception:
            pass
        
        # Fallback to environment variable
        if not verify_token:
            verify_token = getattr(settings, 'WHATSAPP_WEBHOOK_VERIFY_TOKEN', None)

        if mode == "subscribe" and token == verify_token:
            logging.info("WhatsApp webhook verified successfully")
            # Return the challenge to complete verification
            # Validate that challenge is a valid integer before converting
            try:
                challenge_int = int(challenge) if challenge else 0
                return Response(challenge_int, status=status.HTTP_200_OK)
            except (ValueError, TypeError):
                logging.error(f"Invalid challenge value received: {challenge}")
                return Response(
                    {"detail": "Invalid challenge parameter"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            logging.warning(
                f"WhatsApp webhook verification failed. Mode: {mode}, Token match: {token == verify_token}"
            )
            return Response(
                {"detail": "Verification failed"},
                status=status.HTTP_403_FORBIDDEN
            )

    def post(self, request, *args, **kwargs):
        """
        Receives webhook notifications from WhatsApp.
        
        Common notification types:
        - messages: Incoming messages from users
        - message_status: Delivery/read receipts
        - messaging_product: WhatsApp Business API events
        """
        data = request.data
        
        try:
            # Log the webhook for debugging
            logging.info(f"WhatsApp webhook received: {data}")
            
            # Extract webhook data
            # Format: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components
            if "entry" in data:
                for entry in data.get("entry", []):
                    for change in entry.get("changes", []):
                        value = change.get("value", {})
                        
                        # Handle incoming messages
                        if "messages" in value:
                            messages = value.get("messages", [])
                            for message in messages:
                                self._handle_incoming_message(message, value)
                        
                        # Handle message status updates (delivered, read, failed)
                        if "statuses" in value:
                            statuses = value.get("statuses", [])
                            for status_update in statuses:
                                self._handle_status_update(status_update)
            
            # Return 200 OK to acknowledge receipt
            return Response({"status": "received"}, status=status.HTTP_200_OK)
            
        except Exception as e:
            logging.error(f"Error processing WhatsApp webhook: {e}", exc_info=True)
            # Still return 200 to prevent Meta from retrying
            return Response({"status": "error"}, status=status.HTTP_200_OK)

    def _handle_incoming_message(self, message, value):
        """
        Process incoming WhatsApp messages.
        
        Note: For most cases, Ovii sends template messages (one-way notifications).
        If you want to support two-way messaging, implement logic here.
        """
        message_type = message.get("type")
        from_number = message.get("from")
        message_id = message.get("id")
        timestamp = message.get("timestamp")
        
        logging.info(
            f"Incoming WhatsApp message from {from_number}: "
            f"Type={message_type}, ID={message_id}"
        )
        
        # Example: Handle text messages
        if message_type == "text":
            text_body = message.get("text", {}).get("body", "")
            logging.info(f"Message text: {text_body}")
            
            # TODO: Implement your business logic here
            # For example:
            # - Parse commands (e.g., "BALANCE", "HELP")
            # - Store messages in database
            # - Trigger automated responses
            # - Create support tickets
        
        # Handle other message types (image, document, etc.)
        # Refer to: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components

    def _handle_status_update(self, status_update):
        """
        Process message delivery status updates.
        
        Status types:
        - sent: Message sent to WhatsApp server
        - delivered: Message delivered to user's device
        - read: User read the message
        - failed: Message delivery failed
        """
        message_id = status_update.get("id")
        status_value = status_update.get("status")
        timestamp = status_update.get("timestamp")
        recipient = status_update.get("recipient_id")
        
        logging.info(
            f"WhatsApp message status update: "
            f"ID={message_id}, Status={status_value}, Recipient={recipient}"
        )
        
        # TODO: Update notification status in database
        # Example:
        # try:
        #     from notifications.models import Notification
        #     notification = Notification.objects.get(
        #         channel=Notification.Channel.WHATSAPP,
        #         external_id=message_id
        #     )
        #     if status_value == "delivered":
        #         notification.status = Notification.Status.SENT
        #     elif status_value == "failed":
        #         notification.status = Notification.Status.FAILED
        #     notification.save()
        # except Notification.DoesNotExist:
        #     pass
