from django.db.models import Q
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Transaction
from .serializers import (WalletSerializer, TransactionSerializer, TransactionCreateSerializer,
                          AgentCashInSerializer, CustomerCashOutRequestSerializer)
from .permissions import IsMobileVerifiedOrHigher
from .services import create_transaction, TransactionError, TransactionLimitExceededError
from agents.permissions import IsApprovedAgent
from users.models import OviiUser
from users.tasks import send_realtime_notification


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


class CustomerCashOutRequestView(generics.CreateAPIView):
    """
    API view for a customer to initiate a cash-out request with an agent.
    The transaction moves funds from the customer's wallet to the agent's wallet.
    """
    serializer_class = CustomerCashOutRequestSerializer
    permission_classes = [IsAuthenticated, IsMobileVerifiedOrHigher]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        customer_wallet = request.user.wallet
        agent_wallet = serializer.validated_data['agent_wallet']
        amount = serializer.validated_data['amount']

        try:
            transaction = create_transaction(
                sender_wallet=customer_wallet,
                receiver_wallet=agent_wallet,
                amount=amount,
                transaction_type=Transaction.TransactionType.WITHDRAWAL,
                description=f"Customer cash-out with Agent {agent_wallet.user.agent_profile.agent_code}"
            )
            response_serializer = TransactionSerializer(transaction)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        except (TransactionError, TransactionLimitExceededError) as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AgentCashInView(generics.CreateAPIView):
    """
    API view for an approved agent to perform a cash-in (deposit) for a customer.
    The transaction moves funds from the agent's wallet to the customer's wallet.
    """
    serializer_class = AgentCashInSerializer
    permission_classes = [IsApprovedAgent]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        agent_wallet = request.user.wallet
        customer_wallet = serializer.validated_data['customer_wallet']
        amount = serializer.validated_data['amount']

        try:
            transaction = create_transaction(
                sender_wallet=agent_wallet,
                receiver_wallet=customer_wallet,
                amount=amount,
                transaction_type=Transaction.TransactionType.DEPOSIT,
                description=f"Agent cash-in for {customer_wallet.user.phone_number}"
            )
            response_serializer = TransactionSerializer(transaction)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        except (TransactionError, TransactionLimitExceededError) as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
