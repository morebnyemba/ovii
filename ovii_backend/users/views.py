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
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth
from rest_framework import generics, viewsets, status, mixins
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.throttling import AnonRateThrottle
from wallets.permissions import IsMobileVerifiedOrHigher

from .models import OviiUser, KYCDocument, VerificationLevels, Referral
from wallets.models import Transaction
from .serializers import (
    UserDetailSerializer,
    OTPRequestSerializer,
    UserLoginSerializer,
    UserRegistrationVerifySerializer,
    InitialRegistrationSerializer,
    SetTransactionPINSerializer,
    KYCDocumentSerializer,
    AdminUserManagementSerializer,
    UserProfileUpdateSerializer,
    ReferralSerializer,
    GenerateReferralCodeSerializer,
    RequestPINResetSerializer,
    VerifyAndResetPINSerializer,
)

# Get a logger instance for this file
logger = logging.getLogger(__name__)


class ApiRootView(APIView):
    """
    A simple view for the API root that provides a welcome message.
    This confirms the API is running and can link to documentation.
    """

    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        return Response(
            {
                "message": "Welcome to the Ovii API!",
                "version": "1.0.0",
                "docs": "/api/docs/",  # Example link to API documentation
            }
        )


class OTPRequestView(generics.CreateAPIView):
    """
    API view for requesting an OTP.
    """

    throttle_classes = [AnonRateThrottle]
    serializer_class = OTPRequestSerializer
    permission_classes = [AllowAny]

    def get_throttles(self):
        self.throttle_scope = "otp.request"
        return super().get_throttles()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            phone_number = serializer.validated_data.get("phone_number")
            response_data = serializer.save()
            logger.info(f"OTP requested successfully for phone number: {phone_number}")
            return Response(response_data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            logger.warning(
                f"OTP request validation failed for data: {request.data}. Error: {e.detail}"
            )
            raise
        except Exception as e:
            logger.error(
                f"An unexpected error occurred during OTP request for data: {request.data}. Error: {e}",
                exc_info=True,
            )
            return Response(
                {"detail": "An unexpected server error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


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
            user_id = response_data.get("user", {}).get("id")
            logger.info(f"User login successful for user ID: {user_id}")
            return Response(response_data, status=status.HTTP_200_OK)
        except ValidationError as e:
            logger.warning(
                f"User login failed for request data: {request.data}. Error: {e.detail}"
            )
            raise
        except Exception as e:
            logger.error(
                f"An unexpected error occurred during user login. Error: {e}",
                exc_info=True,
            )
            return Response(
                {"detail": "An unexpected server error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


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
            logger.info(
                f"New user registration started for phone: {serializer.validated_data['phone_number']}"
            )
            return Response(response_data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            logger.warning(
                f"Initial registration failed for data: {request.data}. Error: {e.detail}"
            )
            raise
        except Exception as e:
            logger.error(
                f"An unexpected error occurred during initial registration. Error: {e}",
                exc_info=True,
            )
            return Response(
                {"detail": "An unexpected server error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


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
            user_id = response_data.get("user", {}).get("id")
            logger.info(f"New user registration successful. User ID: {user_id}")
            return Response(response_data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            logger.warning(
                f"User registration failed for data: {request.data}. Error: {e.detail}"
            )
            raise
        except Exception as e:
            logger.error(
                f"An unexpected error occurred during user registration. Error: {e}",
                exc_info=True,
            )
            return Response(
                {"detail": "An unexpected server error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class SetTransactionPINView(generics.GenericAPIView):
    """
    API view for an authenticated user to set their transaction PIN.
    """

    serializer_class = SetTransactionPINSerializer
    permission_classes = [IsAuthenticated, IsMobileVerifiedOrHigher]

    def post(self, request, *args, **kwargs):
        user = request.user
        if user.has_set_pin:
            return Response(
                {"detail": "Transaction PIN has already been set."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            user.set_pin(serializer.validated_data["pin"])
            user.has_set_pin = True
            user.save(update_fields=["pin", "has_set_pin"])

            # After setting the PIN, issue a new token with the updated 'has_set_pin' claim.
            refresh = RefreshToken.for_user(user)
            refresh.access_token["has_set_pin"] = user.has_set_pin

            logger.info(f"Transaction PIN set successfully for user: {request.user.id}")
            return Response(
                {
                    "detail": "PIN set successfully.",
                    "tokens": {
                        "refresh": str(refresh),
                        "access": str(refresh.access_token),
                    },
                },
                status=status.HTTP_200_OK,
            )
        except ValidationError as e:
            logger.warning(
                f"PIN set failed for user {request.user.id}. Error: {e.detail}"
            )
            raise
        except Exception as e:
            logger.error(
                f"Unexpected error setting PIN for user {request.user.id}. Error: {e}",
                exc_info=True,
            )
            return Response(
                {"detail": "An unexpected error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    API view for retrieving and updating the authenticated user's profile.
    """

    queryset = OviiUser.objects.all()
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return UserProfileUpdateSerializer
        return UserDetailSerializer

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        if response.status_code == 200:
            logger.info(
                f"User profile updated successfully for user: {request.user.id}"
            )
        return response


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for administrative management of users.
    """

    queryset = OviiUser.objects.all().order_by("phone_number")
    serializer_class = AdminUserManagementSerializer
    permission_classes = [IsAdminUser]

    def perform_update(self, serializer):
        super().perform_update(serializer)
        logger.info(
            f"Admin {self.request.user.id} updated user profile for user: {serializer.instance.id}"
        )

    def perform_destroy(self, instance):
        logger.warning(
            f"Admin {self.request.user.id} deleted user: {instance.id} ({instance.phone_number})"
        )
        super().perform_destroy(instance)


class KYCDocumentViewSet(
    mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet
):
    """
    ViewSet for users to manage their KYC documents.
    """

    serializer_class = KYCDocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return KYCDocument.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        logger.info(
            f"KYC Document of type '{serializer.validated_data['document_type']}' uploaded for user: {self.request.user.id}"
        )


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
        verification_counts = (
            OviiUser.objects.values("verification_level")
            .annotate(count=Count("id"))
            .order_by("verification_level")
        )
        verification_data = {
            "labels": [
                VerificationLevels(level["verification_level"]).label
                for level in verification_counts
            ],
            "counts": [level["count"] for level in verification_counts],
        }

        # 2. Data for User Signups in the Last 30 Days (Line Chart)
        thirty_days_ago = datetime.date.today() - datetime.timedelta(days=30)
        signups = (
            OviiUser.objects.filter(date_joined__gte=thirty_days_ago)
            .annotate(day=TruncDay("date_joined"))
            .values("day")
            .annotate(count=Count("id"))
            .order_by("day")
        )
        signup_data = {
            "labels": [s["day"].strftime("%b %d") for s in signups],
            "counts": [s["count"] for s in signups],
        }

        # 3. Data for Transaction Volume in the Last 30 Days (Bar Chart)
        transactions = (
            Transaction.objects.filter(
                timestamp__gte=thirty_days_ago, status=Transaction.Status.COMPLETED
            )
            .annotate(day=TruncDay("timestamp"))
            .values("day")
            .annotate(volume=Sum("amount"))
            .order_by("day")
        )
        transaction_data = {
            "labels": [t["day"].strftime("%b %d") for t in transactions],
            "volumes": [
                t["volume"] or 0 for t in transactions
            ],  # Ensure None is handled
        }

        return JsonResponse(
            {
                "verification_data": verification_data,
                "signup_data": signup_data,
                "transaction_data": transaction_data,
            }
        )
    except Exception as e:
        logger.error(
            f"Failed to generate dashboard chart data. Error: {e}", exc_info=True
        )
        return JsonResponse(
            {"detail": "An error occurred while generating chart data."}, status=500
        )


# --- Referral System Views ---


class GenerateReferralCodeView(generics.GenericAPIView):
    """
    API view for a user to generate their unique referral code.
    """

    serializer_class = GenerateReferralCodeSerializer
    permission_classes = [IsAuthenticated, IsMobileVerifiedOrHigher]

    def post(self, request, *args, **kwargs):
        user = request.user
        try:
            referral_code = user.generate_referral_code()
            logger.info(f"Referral code generated for user: {user.id}")
            return Response(
                {"referral_code": referral_code},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            logger.error(
                f"Failed to generate referral code for user {user.id}. Error: {e}",
                exc_info=True,
            )
            return Response(
                {"detail": "Failed to generate referral code."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class MyReferralCodeView(APIView):
    """
    API view to get the authenticated user's referral code.
    If the user doesn't have one, it generates one.
    """

    permission_classes = [IsAuthenticated, IsMobileVerifiedOrHigher]

    def get(self, request, *args, **kwargs):
        user = request.user
        if not user.referral_code:
            user.generate_referral_code()
        return Response(
            {"referral_code": user.referral_code},
            status=status.HTTP_200_OK,
        )


class MyReferralsView(generics.ListAPIView):
    """
    API view to list all referrals made by the authenticated user.
    """

    serializer_class = ReferralSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Referral.objects.filter(referrer=self.request.user).order_by("-created_at")


class ReferralStatsView(APIView):
    """
    API view to get referral statistics for the authenticated user.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        referrals = Referral.objects.filter(referrer=user)
        total_referrals = referrals.count()
        credited_referrals = referrals.filter(
            bonus_status=Referral.BonusStatus.CREDITED
        ).count()
        pending_referrals = referrals.filter(
            bonus_status=Referral.BonusStatus.PENDING
        ).count()
        total_earnings = referrals.filter(
            bonus_status=Referral.BonusStatus.CREDITED
        ).aggregate(total=Sum("referrer_bonus"))["total"] or 0

        return Response(
            {
                "referral_code": user.referral_code,
                "total_referrals": total_referrals,
                "credited_referrals": credited_referrals,
                "pending_referrals": pending_referrals,
                "total_earnings": total_earnings,
            },
            status=status.HTTP_200_OK,
        )


# --- PIN Reset Views ---


class RequestPINResetView(generics.GenericAPIView):
    """
    API view for an authenticated user to request a PIN reset.
    Sends an OTP to the user's phone number.
    """

    serializer_class = RequestPINResetSerializer
    permission_classes = [IsAuthenticated, IsMobileVerifiedOrHigher]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            response_data = serializer.save()
            logger.info(f"PIN reset OTP requested for user: {request.user.id}")
            return Response(response_data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(
                f"Failed to request PIN reset for user {request.user.id}. Error: {e}",
                exc_info=True,
            )
            return Response(
                {"detail": "An unexpected error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class VerifyAndResetPINView(generics.GenericAPIView):
    """
    API view to verify OTP and reset the transaction PIN.
    """

    serializer_class = VerifyAndResetPINSerializer
    permission_classes = [IsAuthenticated, IsMobileVerifiedOrHigher]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            response_data = serializer.save()
            logger.info(f"PIN reset successfully for user: {request.user.id}")
            return Response(response_data, status=status.HTTP_200_OK)
        except ValidationError as e:
            logger.warning(
                f"PIN reset failed for user {request.user.id}. Error: {e.detail}"
            )
            raise
        except Exception as e:
            logger.error(
                f"Unexpected error resetting PIN for user {request.user.id}. Error: {e}",
                exc_info=True,
            )
            return Response(
                {"detail": "An unexpected error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# --- Enhanced Analytics Dashboard Views ---


@staff_member_required
def enhanced_dashboard_analytics(request):
    """
    Provides enhanced analytics data for the admin dashboard.
    Includes DAU/WAU/MAU metrics, KYC conversion rates, and more.
    """
    logger.info(f"Admin user {request.user.id} accessed enhanced dashboard analytics.")
    try:
        today = datetime.date.today()

        # --- Active User Metrics ---
        # Daily Active Users (DAU) - users who logged in today
        dau = OviiUser.objects.filter(
            last_login__date=today
        ).count()

        # Weekly Active Users (WAU) - users who logged in in the last 7 days
        week_ago = today - datetime.timedelta(days=7)
        wau = OviiUser.objects.filter(
            last_login__date__gte=week_ago
        ).count()

        # Monthly Active Users (MAU) - users who logged in in the last 30 days
        month_ago = today - datetime.timedelta(days=30)
        mau = OviiUser.objects.filter(
            last_login__date__gte=month_ago
        ).count()

        # Total registered users
        total_users = OviiUser.objects.count()

        # --- KYC Conversion Rates ---
        level_0_count = OviiUser.objects.filter(verification_level=0).count()
        level_1_count = OviiUser.objects.filter(verification_level=1).count()
        level_2_count = OviiUser.objects.filter(verification_level=2).count()
        level_3_count = OviiUser.objects.filter(verification_level=3).count()

        # Calculate conversion rates
        kyc_mobile_verified_rate = (
            (level_1_count + level_2_count + level_3_count) / total_users * 100
            if total_users > 0
            else 0
        )
        kyc_identity_verified_rate = (
            (level_2_count + level_3_count) / total_users * 100
            if total_users > 0
            else 0
        )
        kyc_fully_verified_rate = (
            level_3_count / total_users * 100 if total_users > 0 else 0
        )

        # --- Referral Metrics ---
        total_referrals = Referral.objects.count()
        credited_referrals = Referral.objects.filter(
            bonus_status=Referral.BonusStatus.CREDITED
        ).count()
        pending_referrals = Referral.objects.filter(
            bonus_status=Referral.BonusStatus.PENDING
        ).count()

        # --- User Growth Trends (last 30 days) ---
        signups_by_day = (
            OviiUser.objects.filter(date_joined__date__gte=month_ago)
            .annotate(day=TruncDay("date_joined"))
            .values("day")
            .annotate(count=Count("id"))
            .order_by("day")
        )
        user_growth_data = {
            "labels": [s["day"].strftime("%b %d") for s in signups_by_day],
            "counts": [s["count"] for s in signups_by_day],
        }

        # --- Transaction Volume Trends (last 30 days) ---
        transactions_by_day = (
            Transaction.objects.filter(
                timestamp__date__gte=month_ago,
                status=Transaction.Status.COMPLETED,
            )
            .annotate(day=TruncDay("timestamp"))
            .values("day")
            .annotate(count=Count("id"), volume=Sum("amount"))
            .order_by("day")
        )
        transaction_volume_data = {
            "labels": [t["day"].strftime("%b %d") for t in transactions_by_day],
            "counts": [t["count"] for t in transactions_by_day],
            "volumes": [float(t["volume"] or 0) for t in transactions_by_day],
        }

        return JsonResponse(
            {
                "active_users": {
                    "dau": dau,
                    "wau": wau,
                    "mau": mau,
                    "total_users": total_users,
                },
                "kyc_metrics": {
                    "level_0": level_0_count,
                    "level_1": level_1_count,
                    "level_2": level_2_count,
                    "level_3": level_3_count,
                    "mobile_verified_rate": round(kyc_mobile_verified_rate, 2),
                    "identity_verified_rate": round(kyc_identity_verified_rate, 2),
                    "fully_verified_rate": round(kyc_fully_verified_rate, 2),
                },
                "referral_metrics": {
                    "total_referrals": total_referrals,
                    "credited_referrals": credited_referrals,
                    "pending_referrals": pending_referrals,
                },
                "user_growth_data": user_growth_data,
                "transaction_volume_data": transaction_volume_data,
            }
        )
    except Exception as e:
        logger.error(
            f"Failed to generate enhanced dashboard analytics. Error: {e}",
            exc_info=True,
        )
        return JsonResponse(
            {"detail": "An error occurred while generating analytics."}, status=500
        )
