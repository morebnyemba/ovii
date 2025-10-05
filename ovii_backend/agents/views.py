"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: Defines API views for the agents app.
"""

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from wallets.models import Transaction
from wallets.serializers import AgentCashInSerializer, CustomerCashOutRequestSerializer
from wallets.services import create_transaction, TransactionError, TransactionLimitExceededError
from wallets.permissions import IsMobileVerifiedOrHigher
from .permissions import IsApprovedAgent


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