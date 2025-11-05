"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: Defines API views for the merchants app.
"""

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .permissions import IsApprovedMerchant, IsApprovedMerchantAPI
from .serializers import (
    MerchantProfileSerializer,
    MerchantProfileUpdateSerializer,
    MerchantOnboardingSerializer,
)
from wallets.serializers import MerchantPaymentRequestSerializer, TransactionSerializer
from wallets.models import Transaction


class MerchantOnboardingView(generics.CreateAPIView):
    """
    API view for a new merchant to onboard.
    """

    serializer_class = MerchantOnboardingSerializer

    def perform_create(self, serializer):
        """
        Creates a new merchant and sets the user's role to MERCHANT.
        """
        from users.models import OviiUser

        user = self.request.user
        user.role = OviiUser.Role.MERCHANT
        user.save()
        serializer.save(user=user)


class MerchantProfileView(generics.RetrieveUpdateAPIView):
    """
    API view for an approved merchant to retrieve and update their profile.
    Handles GET to retrieve and PUT/PATCH to update.
    """

    permission_classes = [IsApprovedMerchant]

    def get_object(self):
        # The permission class ensures merchant_profile exists.
        return self.request.user.merchant_profile

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return MerchantProfileUpdateSerializer
        return MerchantProfileSerializer


class RegenerateAPIKeyView(APIView):
    """
    API view for a merchant to regenerate their API key.
    """

    permission_classes = [IsApprovedMerchant]

    def post(self, request, *args, **kwargs):
        """
        Generates a new API key for the merchant and returns it.
        """
        merchant = request.user.merchant_profile
        merchant.regenerate_api_key()
        return Response(
            {
                "detail": "API Key regenerated successfully.",
                "api_key": str(merchant.api_key),
            },
            status=status.HTTP_200_OK,
        )


class MerchantRequestPaymentView(generics.CreateAPIView):
    """
    API view for a merchant to request a payment from a customer.
    This endpoint is authenticated via the merchant's API key.
    """

    serializer_class = MerchantPaymentRequestSerializer
    permission_classes = [IsApprovedMerchantAPI]

    def perform_create(self, serializer):
        """
        Creates a PENDING transaction owned by the customer, with the
        merchant's wallet as the related_wallet.
        """
        from wallets.models import Transaction, Wallet
        from users.models import OviiUser

        merchant_wallet = self.request.user.wallet
        customer_phone = serializer.validated_data["customer_phone_number"]
        customer = OviiUser.objects.get(phone_number=customer_phone)

        # The transaction is created on behalf of the customer, so their
        # wallet is the primary wallet for this PENDING transaction.
        serializer.save(
            wallet=customer.wallet,
            related_wallet=merchant_wallet,
            status=Transaction.Status.PENDING,
            transaction_type=Transaction.TransactionType.PAYMENT,
        )


class MerchantTransactionHistoryView(generics.ListAPIView):
    """
    API view for a merchant to retrieve their transaction history.
    """

    serializer_class = TransactionSerializer
    permission_classes = [IsApprovedMerchant]

    def get_queryset(self):
        """
        Returns the transactions where the merchant is either the sender or the receiver.
        """
        user = self.request.user
        return Transaction.objects.filter(
            models.Q(wallet__user=user) | models.Q(related_wallet__user=user)
        ).order_by("-timestamp")
