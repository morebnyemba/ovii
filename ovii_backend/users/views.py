"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-20
Description: Defines API views for the users app.
"""

from rest_framework import generics, viewsets, status, mixins
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from wallets.permissions import CanPerformTransactions

from .models import OviiUser, KYCDocument
from .serializers import UserDetailSerializer, OTPRequestSerializer, OTPVerificationSerializer, SetTransactionPINSerializer, KYCDocumentSerializer, AdminUserManagementSerializer, UserProfileUpdateSerializer


class OTPRequestView(generics.CreateAPIView):
    """
    API view for requesting an OTP.
    """
    # Apply a specific, stricter throttle rate for this sensitive endpoint.
    throttle_classes = [AnonRateThrottle]
    serializer_class = OTPRequestSerializer
    permission_classes = [AllowAny]

    def get_throttles(self):
        # Override the default 'anon' rate with a custom one.
        self.throttle_scope = 'otp.request'
        return super().get_throttles()

class OTPVerificationView(generics.CreateAPIView):
    """
    API view for verifying an OTP and creating/logging in a user.
    """
    serializer_class = OTPVerificationSerializer
    permission_classes = [AllowAny]

class SetTransactionPINView(generics.GenericAPIView):
    """
    API view for an authenticated user to set their transaction PIN.
    """
    serializer_class = SetTransactionPINSerializer
    permission_classes = [IsAuthenticated, CanPerformTransactions]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request.user.set_pin(serializer.validated_data['pin'])
        return Response({"detail": "Transaction PIN set successfully."}, status=status.HTTP_200_OK)

class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    API view for retrieving and updating the authenticated user's profile.
    Handles GET and PATCH requests to /api/users/me/.
    """
    queryset = OviiUser.objects.all()
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """
        Overrides the default get_object to return the current user.
        """
        return self.request.user

    def get_serializer_class(self):
        """
        Return the appropriate serializer class based on the request method.
        """
        if self.request.method in ['PUT', 'PATCH']:
            return UserProfileUpdateSerializer
        return UserDetailSerializer


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for administrative management of users.
    Provides list, retrieve, update, and destroy actions for admins.
    """
    queryset = OviiUser.objects.all().order_by('phone_number')
    serializer_class = AdminUserManagementSerializer
    permission_classes = [IsAdminUser]


class KYCDocumentViewSet(mixins.CreateModelMixin,
                         mixins.ListModelMixin,
                         viewsets.GenericViewSet):
    """
    ViewSet for users to manage their KYC documents.
    Allows users to upload (create) and list their own documents.
    Update and delete actions are intentionally disabled.
    """
    serializer_class = KYCDocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """This view should only return documents for the currently authenticated user."""
        return KYCDocument.objects.filter(user=self.request.user)