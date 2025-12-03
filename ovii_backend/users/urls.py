"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-20
Description: URL patterns for the users app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserProfileView,
    UserViewSet,
    OTPRequestView,
    SetTransactionPINView,
    KYCDocumentViewSet,
    UserLoginView,
    UserRegistrationStartView,
    UserRegistrationVerifyView,
    GenerateReferralCodeView,
    MyReferralCodeView,
    MyReferralsView,
    ReferralStatsView,
    RequestPINResetView,
    VerifyAndResetPINView,
    ClaimReferralBonusView,
)

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r"manage", UserViewSet, basename="user-manage")
router.register(r"kyc-documents", KYCDocumentViewSet, basename="kyc-document")

urlpatterns = [
    # OTP Authentication Endpoints
    path("otp/request/", OTPRequestView.as_view(), name="otp-request"),
    # New, two-step registration flow
    path(
        "register/start/",
        UserRegistrationStartView.as_view(),
        name="user-register-start",
    ),
    path(
        "auth/register/",
        UserRegistrationVerifyView.as_view(),
        name="user-register-verify",
    ),
    path("auth/login/", UserLoginView.as_view(), name="user-login"),
    # Authenticated User Endpoints
    path("me/", UserProfileView.as_view(), name="user-profile"),
    path("me/set-pin/", SetTransactionPINView.as_view(), name="user-set-pin"),
    # PIN Reset Endpoints
    path("me/pin/request-reset/", RequestPINResetView.as_view(), name="pin-reset-request"),
    path("me/pin/reset/", VerifyAndResetPINView.as_view(), name="pin-reset-verify"),
    # Referral Endpoints
    path("me/referral-code/", MyReferralCodeView.as_view(), name="my-referral-code"),
    path("me/referral-code/generate/", GenerateReferralCodeView.as_view(), name="generate-referral-code"),
    path("me/referrals/", MyReferralsView.as_view(), name="my-referrals"),
    path("me/referrals/stats/", ReferralStatsView.as_view(), name="referral-stats"),
    path("me/referrals/claim-bonus/", ClaimReferralBonusView.as_view(), name="claim-referral-bonus"),
    # Include the admin management URLs from the router.
    path("", include(router.urls)),
]
