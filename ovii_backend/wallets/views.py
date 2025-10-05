from django.db.models import Q
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Transaction
from .serializers import (WalletSerializer, TransactionSerializer, TransactionCreateSerializer, ApproveMerchantPaymentSerializer)
from .permissions import IsMobileVerifiedOrHigher
from .services import create_transaction, TransactionError, TransactionLimitExceededError


class MyWalletView(generics.RetrieveAPIView):
    """
    API view for an authenticated user to retrieve their wallet details.
    """
    serializer_class = WalletSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.wallet


class TransactionHistoryView(generics.ListAPIView):
    """
    API view for an authenticated user to retrieve their transaction history,
    listing both sent and received transactions, ordered by most recent.
    """
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_wallet = self.request.user.wallet
        return Transaction.objects.filter(
            Q(wallet=user_wallet) | Q(related_wallet=user_wallet)
        ).select_related('wallet__user', 'related_wallet__user').order_by('-timestamp')


class CreateTransactionView(generics.CreateAPIView):
    """
    API view to create a new peer-to-peer transaction.
    Uses the perform_wallet_transfer service to ensure atomicity.
    """
    serializer_class = TransactionCreateSerializer
    permission_classes = [IsAuthenticated, IsMobileVerifiedOrHigher]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        source_wallet = request.user.wallet
        receiver_wallet = serializer.validated_data['destination_wallet']
        amount = serializer.validated_data['amount']
        description = serializer.validated_data.get('description', "")

        try:
            transaction = create_transaction(
                sender_wallet=source_wallet,
                receiver_wallet=receiver_wallet,
                amount=amount,
                description=description
            )
            response_serializer = TransactionSerializer(transaction)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        except (TransactionError, TransactionLimitExceededError) as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ApproveMerchantPaymentView(generics.APIView):
    """
    API view for a customer to approve a pending merchant payment.
    """
    serializer_class = ApproveMerchantPaymentSerializer
    permission_classes = [IsAuthenticated, IsMobileVerifiedOrHigher]

    def post(self, request, transaction_id, *args, **kwargs):
        try:
            pending_tx = Transaction.objects.get(
                id=transaction_id,
                wallet=request.user.wallet, # Ensure the user owns this transaction
                status=Transaction.Status.PENDING,
                transaction_type=Transaction.TransactionType.PAYMENT
            )
        except Transaction.DoesNotExist:
            return Response({"detail": "Pending payment not found or you do not have permission to approve it."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            # The create_transaction service will handle the fund transfer and send notifications.
            # We mark the original pending transaction as failed to avoid confusion.
            completed_tx = create_transaction(
                sender_wallet=pending_tx.wallet,
                receiver_wallet=pending_tx.related_wallet,
                amount=pending_tx.amount,
                transaction_type=Transaction.TransactionType.PAYMENT,
                description=pending_tx.description
            )
            pending_tx.status = Transaction.Status.FAILED # Mark original request as obsolete
            pending_tx.description = f"Superseded by transaction {completed_tx.id}"
            pending_tx.save()
            return Response({"detail": "Payment approved and completed successfully."}, status=status.HTTP_200_OK)
        except (TransactionError, TransactionLimitExceededError) as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
