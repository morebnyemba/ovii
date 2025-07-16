from django.db.models import Q
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Transaction
from .serializers import (WalletSerializer, TransactionSerializer,
                          TransactionCreateSerializer)
from users.permissions import CanPerformTransactions
from .services import perform_wallet_transfer, InsufficientFundsError, TransactionLimitExceededError


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
            Q(source_wallet=user_wallet) | Q(destination_wallet=user_wallet)
        ).select_related('source_wallet__user', 'destination_wallet__user').order_by('-timestamp')


class CreateTransactionView(generics.CreateAPIView):
    """
    API view to create a new peer-to-peer transaction.
    Uses the perform_wallet_transfer service to ensure atomicity.
    """
    serializer_class = TransactionCreateSerializer
    permission_classes = [IsAuthenticated, CanPerformTransactions]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        source_wallet = request.user.wallet
        destination_wallet = serializer.validated_data['destination_wallet']
        amount = serializer.validated_data['amount']

        try:
            transaction = perform_wallet_transfer(
                source_wallet=source_wallet,
                destination_wallet=destination_wallet,
                amount=amount
            )
            response_serializer = TransactionSerializer(transaction)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        except (InsufficientFundsError, TransactionLimitExceededError) as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
