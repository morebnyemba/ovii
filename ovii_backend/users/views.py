"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-20
Description: Defines API views for the users app with robust logging.
"""

import logging
import datetime
from django.http import JsonResponse
from django.contrib.admin.views.decorators import staff_member_required
from django.db.models import Count, Sum
from django.db.models.functions import TruncDay
from rest_framework import generics, viewsets, status, mixins
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.throttling import AnonRateThrottle
from wallets.permissions import IsMobileVerifiedOrHigher

from .models import OviiUser, KYCDocument, VerificationLevels
from wallets.models import Transaction
from .serializers import (
    UserDetailSerializer, OTPRequestSerializer,
    UserLoginSerializer, UserRegistrationVerifySerializer, InitialRegistrationSerializer,
    SetTransactionPINSerializer, KYCDocumentSerializer,
    AdminUserManagementSerializer, UserProfileUpdateSerializer
)

# Get a logger instance for this file
logger = logging.getLogger(__name__)


class OTPRequestView(generics.CreateAPIView):
    """
    API view for requesting an OTP.
    """
    throttle_classes = [AnonRateThrottle]
    serializer_class = OTPRequestSerializer
    permission_classes = [AllowAny]

    def get_throttles(self):
        self.throttle_scope = 'otp.request'
        return super().get_throttles()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            phone_number = serializer.validated_data.get('phone_number')
            response_data = serializer.save()
            logger.info(f"OTP requested successfully for phone number: {phone_number}")
            return Response(response_data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            logger.warning(f"OTP request validation failed for data: {request.data}. Error: {e.detail}")
            raise
        except Exception as e:
            logger.error(f"An unexpected error occurred during OTP request for data: {request.data}. Error: {e}", exc_info=True)
            return Response({"detail": "An unexpected server error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserLoginView(generics.GenericAPIView):
    """
    API view for user login with OTP.
    Handles POST requests to /api/users/auth/login/
    """
    serializer_class = UserLoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        """
        Handles the login request, returning user data and tokens.
        """
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            response_data = serializer.save()
            user_id = response_data.get('user', {}).get('id')
            logger.info(f"User login successful for user ID: {user_id}")
            return Response(response_data, status=status.HTTP_200_OK)
        except ValidationError as e:
            logger.warning(f"User login failed for request data: {request.data}. Error: {e.detail}")
            raise
        except Exception as e:
            logger.error(f"An unexpected error occurred during user login. Error: {e}", exc_info=True)
            return Response({"detail": "An unexpected server error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserRegistrationStartView(generics.CreateAPIView):
    """
    API view for the first step of user registration.
    """
    serializer_class = InitialRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        """
        Handles new user registration and returns user data and tokens.
        """
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            response_data = serializer.save()
            logger.info(f"New user registration started for phone: {serializer.validated_data['phone_number']}")
            return Response(response_data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            logger.warning(f"Initial registration failed for data: {request.data}. Error: {e.detail}")
            raise
        except Exception as e:
            logger.error(f"An unexpected error occurred during initial registration. Error: {e}", exc_info=True)
            return Response({"detail": "An unexpected server error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserRegistrationVerifyView(generics.CreateAPIView):
    """
    API view for the second step of user registration (OTP verification).
    """
    serializer_class = UserRegistrationVerifySerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        """
        Handles OTP verification, activates the user, and returns tokens.
        """
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            response_data = serializer.save()
            user_id = response_data.get('user', {}).get('id')
            logger.info(f"New user registration successful. User ID: {user_id}")
            return Response(response_data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            logger.warning(f"User registration failed for data: {request.data}. Error: {e.detail}")
            raise
        except Exception as e:
            logger.error(f"An unexpected error occurred during user registration. Error: {e}", exc_info=True)
            return Response({"detail": "An unexpected server error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SetTransactionPINView(generics.GenericAPIView):
    """
    API view for an authenticated user to set their transaction PIN.
    """
    serializer_class = SetTransactionPINSerializer
    permission_classes = [IsAuthenticated, IsMobileVerifiedOrHigher]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            request.user.set_pin(serializer.validated_data['pin'])
            logger.info(f"Transaction PIN set successfully for user: {request.user.id}")
            return Response({"detail": "Transaction PIN set successfully."}, status=status.HTTP_200_OK)
        except ValidationError as e:
            logger.warning(f"PIN set failed for user {request.user.id}. Error: {e.detail}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error setting PIN for user {request.user.id}. Error: {e}", exc_info=True)
            return Response({"detail": "An unexpected error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    API view for retrieving and updating the authenticated user's profile.
    """
    queryset = OviiUser.objects.all()
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserProfileUpdateSerializer
        return UserDetailSerializer

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        if response.status_code == 200:
            logger.info(f"User profile updated successfully for user: {request.user.id}")
        return response


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for administrative management of users.
    """
    queryset = OviiUser.objects.all().order_by('phone_number')
    serializer_class = AdminUserManagementSerializer
    permission_classes = [IsAdminUser]

    def perform_update(self, serializer):
        super().perform_update(serializer)
        logger.info(f"Admin {self.request.user.id} updated user profile for user: {serializer.instance.id}")

    def perform_destroy(self, instance):
        logger.warning(f"Admin {self.request.user.id} deleted user: {instance.id} ({instance.phone_number})")
        super().perform_destroy(instance)


class KYCDocumentViewSet(mixins.CreateModelMixin,
                         mixins.ListModelMixin,
                         viewsets.GenericViewSet):
    """
    ViewSet for users to manage their KYC documents.
    """
    serializer_class = KYCDocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return KYCDocument.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        logger.info(f"KYC Document of type '{serializer.validated_data['document_type']}' uploaded for user: {self.request.user.id}")


# --- Admin Dashboard Chart Data Endpoint ---

@staff_member_required
def dashboard_chart_data(request):
    """
    Provides data for the admin dashboard charts as JSON.
    This view is protected and only accessible by staff members.
    """
    logger.info(f"Admin user {request.user.id} accessed dashboard chart data.")
    try:
        # 1. Data for Users by Verification Level (Pie Chart)
        verification_counts = OviiUser.objects.values('verification_level').annotate(count=Count('id')).order_by('verification_level')
        verification_data = {
            'labels': [VerificationLevels(level['verification_level']).label for level in verification_counts],
            'counts': [level['count'] for level in verification_counts]
        }

        # 2. Data for User Signups in the Last 30 Days (Line Chart)
        thirty_days_ago = datetime.date.today() - datetime.timedelta(days=30)
        signups = (
            OviiUser.objects.filter(date_joined__gte=thirty_days_ago)
            .annotate(day=TruncDay('date_joined'))
            .values('day')
            .annotate(count=Count('id'))
            .order_by('day')
        )
        signup_data = {
            'labels': [s['day'].strftime('%b %d') for s in signups],
            'counts': [s['count'] for s in signups]
        }

        # 3. Data for Transaction Volume in the Last 30 Days (Bar Chart)
        transactions = (
            Transaction.objects.filter(timestamp__gte=thirty_days_ago, status=Transaction.Status.COMPLETED)
            .annotate(day=TruncDay('timestamp'))
            .values('day')
            .annotate(volume=Sum('amount'))
            .order_by('day')
        )
        transaction_data = {
            'labels': [t['day'].strftime('%b %d') for t in transactions],
            'volumes': [t['volume'] or 0 for t in transactions] # Ensure None is handled
        }
        
        return JsonResponse({
            'verification_data': verification_data,
            'signup_data': signup_data,
            'transaction_data': transaction_data,
        })
    except Exception as e:
        logger.error(f"Failed to generate dashboard chart data. Error: {e}", exc_info=True)
        return JsonResponse({"detail": "An error occurred while generating chart data."}, status=500)