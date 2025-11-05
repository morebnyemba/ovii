"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: Defines API views for the agents app.
"""

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .permissions import IsApprovedAgent
from .serializers import AgentProfileSerializer
from wallets.serializers import AgentCashInSerializer, CustomerCashOutRequestSerializer
from wallets.services import (
    create_transaction,
    TransactionError,
    TransactionLimitExceededError,
)


class AgentProfileView(generics.RetrieveAPIView):
    """
    API view for an approved agent to retrieve their profile details.
    """

    serializer_class = AgentProfileSerializer
    permission_classes = [IsApprovedAgent]

    def get_object(self):
        # The permission class ensures agent_profile exists.
        return self.request.user.agent_profile


class AgentCashInView(generics.CreateAPIView):
    """
    API view for an agent to perform a cash-in (deposit) for a customer.
    """

    serializer_class = AgentCashInSerializer
    permission_classes = [IsApprovedAgent]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        agent_wallet = request.user.wallet
        customer_wallet = serializer.validated_data["customer_wallet"]
        amount = serializer.validated_data["amount"]

        try:
            create_transaction(
                sender_wallet=agent_wallet,
                receiver_wallet=customer_wallet,
                amount=amount,
                description=f"Agent cash-in for {customer_wallet.user.phone_number}",
            )
            return Response(
                {"detail": "Cash-in successful."}, status=status.HTTP_201_CREATED
            )
        except (TransactionError, TransactionLimitExceededError) as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CustomerCashOutRequestView(generics.CreateAPIView):
    """
    API view for a CUSTOMER to request a cash-out from an AGENT.
    """

    serializer_class = CustomerCashOutRequestSerializer
    permission_classes = [IsAuthenticated]  # Any authenticated user can request

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        customer_wallet = request.user.wallet
        agent_wallet = serializer.validated_data["agent_wallet"]
        amount = serializer.validated_data["amount"]

        try:
            create_transaction(
                sender_wallet=customer_wallet,
                receiver_wallet=agent_wallet,
                amount=amount,
                description=f"Customer cash-out to agent {agent_wallet.user.agent_profile.agent_code}",
            )
            return Response(
                {
                    "detail": "Cash-out successful. Please collect your cash from the agent."
                },
                status=status.HTTP_201_CREATED,
            )
        except (TransactionError, TransactionLimitExceededError) as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
