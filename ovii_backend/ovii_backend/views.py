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

from wallets.models import Transaction
from wallets.permissions import IsMobileVerifiedOrHigher
from .services import EcoCashClient


class EcoCashTopUpRequestSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('1.00'))


class EcoCashTopUpRequestView(generics.GenericAPIView):
    """
    Endpoint for a user to request a top-up from their EcoCash account.
    """
    serializer_class = EcoCashTopUpRequestSerializer
    permission_classes = [IsAuthenticated, IsMobileVerifiedOrHigher]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        amount = serializer.validated_data['amount']

        # Create a PENDING deposit transaction in our system first.
        # This allows us to track the request.
        pending_transaction = Transaction.objects.create(
            wallet=user.wallet,
            transaction_type=Transaction.TransactionType.DEPOSIT,
            amount=amount,
            status=Transaction.Status.PENDING,
            description=f"EcoCash top-up request for {user.phone_number}"
        )

        try:
            client = EcoCashClient()
            client.request_c2b_payment(
                phone_number=str(user.phone_number),
                amount=amount,
                reference=str(pending_transaction.id) # Use our transaction ID as the reference
            )
            return Response(
                {"detail": "Please check your phone to approve the payment by entering your EcoCash PIN."},
                status=status.HTTP_202_ACCEPTED
            )
        except Exception as e:
            # If the request to EcoCash fails, mark our transaction as failed.
            pending_transaction.status = Transaction.Status.FAILED
            pending_transaction.save()
            return Response({"detail": "Could not initiate top-up request. Please try again later."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)