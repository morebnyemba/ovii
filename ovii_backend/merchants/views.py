"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: Defines API views for the merchants app.
"""

from rest_framework import generics, status
from rest_framework.response import Response

from wallets.models import Transaction
from wallets.serializers import MerchantPaymentRequestSerializer
from users.models import OviiUser
from users.tasks import send_realtime_notification
from .permissions import IsApprovedMerchantAPI


class MerchantPaymentRequestView(generics.CreateAPIView):
    """
    API view for an approved merchant to request a payment from a customer.
    This creates a PENDING transaction that the customer must approve.
    Authentication is done via an API Key in the Authorization header.
    """
    serializer_class = MerchantPaymentRequestSerializer
    permission_classes = [IsApprovedMerchantAPI]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        merchant = request.merchant
        merchant_wallet = merchant.user.wallet
        customer_phone = serializer.validated_data['customer_phone_number']
        amount = serializer.validated_data['amount']
        description = serializer.validated_data.get('description', f"Payment to {merchant.business_name}")

        customer = OviiUser.objects.get(phone_number=customer_phone)

        pending_transaction = Transaction.objects.create(
            wallet=customer.wallet,
            related_wallet=merchant_wallet,
            amount=amount,
            transaction_type=Transaction.TransactionType.PAYMENT,
            status=Transaction.Status.PENDING,
            description=description
        )

        send_realtime_notification.delay(
            customer.id,
            f"{merchant.business_name} is requesting a payment of ${amount}. Please open your app to approve or decline."
        )

        response_data = {
            "message": "Payment request successfully sent to the customer for approval.",
            "transaction_id": pending_transaction.id,
            "status": pending_transaction.status
        }
        return Response(response_data, status=status.HTTP_202_ACCEPTED)