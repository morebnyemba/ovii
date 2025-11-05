from decimal import Decimal, InvalidOperation
from django.db.models import Q
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Transaction
from .serializers import (
    WalletSerializer,
    TransactionSerializer,
    TransactionCreateSerializer,
    ApproveMerchantPaymentSerializer,
)
from .permissions import IsMobileVerifiedOrHigher
from .services import (
    create_transaction,
    get_transaction_charge,
    TransactionError,
    TransactionLimitExceededError,
)


class GetTransactionChargeView(APIView):
    """
    API view to get the transaction charge for a given amount.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        transaction_type = request.query_params.get("transaction_type")
        amount_str = request.query_params.get("amount")

        if not transaction_type or not amount_str:
            return Response(
                {"detail": "transaction_type and amount are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            amount = Decimal(amount_str)
        except (InvalidOperation, TypeError):
            return Response(
                {"detail": "Invalid amount."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        charge = get_transaction_charge(
            transaction_type, request.user.role, amount
        )
        charge_amount = charge.calculate_charge(amount) if charge else Decimal("0.00")

        return Response(
            {"charge_amount": charge_amount}, status=status.HTTP_200_OK
        )


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
        return (
            Transaction.objects.filter(
                Q(wallet=user_wallet) | Q(related_wallet=user_wallet)
            )
            .select_related("wallet__user", "related_wallet__user")
            .order_by("-timestamp")
        )


class CreateTransactionView(generics.CreateAPIView):
    """
    API view to create a new peer-to-peer transaction.
    Uses the perform_wallet_transfer service to ensure atomicity.
    """

    serializer_class = TransactionCreateSerializer
    permission_classes = [IsAuthenticated, IsMobileVerifiedOrHigher]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            # The serializer's .save() method will now handle the transaction creation
            # because we've implemented the logic in its create() method.
            self.perform_create(
                serializer
            )  # This sets serializer.instance to the created Transaction object
            # Use TransactionSerializer to represent the created transaction for the response
            response_serializer = TransactionSerializer(serializer.instance)
            headers = self.get_success_headers(response_serializer.data)
            return Response(
                response_serializer.data,
                status=status.HTTP_201_CREATED,
                headers=headers,
            )
        except (TransactionError, TransactionLimitExceededError) as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ApproveMerchantPaymentView(APIView):
    """
    API view for a customer to approve a pending merchant payment.
    """

    serializer_class = ApproveMerchantPaymentSerializer
    permission_classes = [IsAuthenticated, IsMobileVerifiedOrHigher]

    def post(self, request, transaction_id, *args, **kwargs):
        try:
            pending_tx = Transaction.objects.get(
                id=transaction_id,
                wallet=request.user.wallet,  # Ensure the 11 owns this transaction
                status=Transaction.Status.PENDING,
                transaction_type=Transaction.TransactionType.PAYMENT,
            )
        except Transaction.DoesNotExist:
            return Response(
                {
                    "detail": "Pending payment not found or you do not have permission to approve it."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

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
                description=pending_tx.description,
            )
            pending_tx.status = (
                Transaction.Status.FAILED
            )  # Mark original request as obsolete
            pending_tx.description = f"Superseded by transaction {completed_tx.id}"
            pending_tx.save()
            return Response(
                {"detail": "Payment approved and completed successfully."},
                status=status.HTTP_200_OK,
            )
        except (TransactionError, TransactionLimitExceededError) as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
