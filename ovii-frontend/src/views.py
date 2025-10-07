"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-20
Description: Defines API views for the users app.
"""

import logging
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import OviiUser, KYCDocument
from .serializers import (
    UserDetailSerializer,
    UserProfileUpdateSerializer,
    AdminUserManagementSerializer,
    SetTransactionPINSerializer,
    InitialRegistrationSerializer,
    OTPRequestSerializer,
    UserLoginSerializer,
    UserRegistrationVerifySerializer,
    KYCDocumentSerializer,
)

logger = logging.getLogger(__name__)


class UserDetailView(generics.RetrieveUpdateAPIView):
    """
    API view for retrieving and updating the authenticated user's details.
    GET: Returns the user's profile.
    PUT/PATCH: Updates the user's profile based on the fields in UserProfileUpdateSerializer.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserProfileUpdateSerializer
        return UserDetailSerializer


class SetTransactionPINView(generics.GenericAPIView):
    """
    API view for a user to set their transaction PIN for the first time.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SetTransactionPINSerializer

    def post(self, request, *args, **kwargs):
        user = request.user
        if user.has_set_pin:
            return Response({"detail": "PIN has already been set."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user.set_pin(serializer.validated_data['pin'])
        user.has_set_pin = True
        user.save(update_fields=['pin', 'has_set_pin'])

        # After setting the PIN, issue a new token with the updated 'has_set_pin' claim.
        refresh = RefreshToken.for_user(user)
        refresh.access_token['has_set_pin'] = user.has_set_pin

        return Response({
            "detail": "PIN set successfully.",
            "tokens": {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)


class InitialRegistrationView(generics.CreateAPIView):
    """
    API view for the first step of user registration.
    Creates an inactive user and sends an OTP.
    """
    serializer_class = InitialRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            response_data = serializer.save()
            logger.info(f"New user registration started for phone: {response_data.get('phone_number')}")
            return Response(response_data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.warning(f"Initial registration failed for data: {request.data}. Error: {e}")
            raise


class OTPRequestView(generics.CreateAPIView):
    """
    API view for requesting an OTP for an existing user (e.g., for login).
    """
    serializer_class = OTPRequestSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        response_data = serializer.save()
        logger.info(f"OTP requested successfully for phone number: {response_data.get('phone_number')}")
        return Response(response_data, status=status.HTTP_201_CREATED)


class UserLoginView(generics.CreateAPIView):
    """
    API view for user login via OTP verification.
    """
    serializer_class = UserLoginSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        response_data = serializer.save()
        user_id = response_data.get('user', {}).get('id')
        logger.info(f"User login successful for user ID: {user_id}")
        return Response(response_data, status=status.HTTP_200_OK)


class UserRegistrationVerifyView(generics.CreateAPIView):
    """
    API view to verify OTP and complete user registration.
    """
    serializer_class = UserRegistrationVerifySerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            response_data = serializer.save()
            user_id = response_data.get('user', {}).get('id')
            logger.info(f"User registration completed for user ID: {user_id}")
            return Response(response_data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"An unexpected error occurred during user registration. Error: {e}")
            return Response({"detail": "An internal error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class KYCDocumentView(generics.ListCreateAPIView):
    """
    API view for listing and creating KYC documents for the authenticated user.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = KYCDocumentSerializer

    def get_queryset(self):
        return KYCDocument.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class LogoutView(APIView):
    """
    A simple view to handle the frontend's POST request to /api/logout.
    This endpoint doesn't need to do anything on the backend since the
    frontend is responsible for clearing the tokens from cookies.
    It's good practice to have an endpoint for the action.
    """
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        return Response(status=status.HTTP_200_OK)
