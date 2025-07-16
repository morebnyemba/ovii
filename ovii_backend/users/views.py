"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-20
Description: Defines API views for the users app.
"""

from rest_framework import generics, viewsets, status, mixins
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from wallets.permissions import IsMobileVerifiedOrHigher
from django.http import JsonResponse
from django.contrib.admin.views.decorators import staff_member_required
from django.db.models import Count, Sum
from django.db.models.functions import TruncDay
import datetime

from .models import OviiUser, KYCDocument, VerificationLevels
from wallets.models import Transaction, Wallet
from .serializers import (UserDetailSerializer, OTPRequestSerializer, OTPVerificationSerializer,
                          SetTransactionPINSerializer, KYCDocumentSerializer, AdminUserManagementSerializer, UserProfileUpdateSerializer)


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
    permission_classes = [IsAuthenticated, IsMobileVerifiedOrHigher]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request.user.set_pin(serializer.validated_data['pin'])  # Ensure this method hashes the PIN
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


@staff_member_required
def dashboard_chart_data(request):
    """
    Provides data for the admin dashboard charts as JSON.
    """
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
        .annotate(count=Count('id'))  # Corrected count aggregation
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
        'volumes': [t['volume'] for t in transactions]
    }
    return JsonResponse({
        'verification_data': verification_data,
        'signup_data': signup_data,
        'transaction_data': transaction_data,
    })