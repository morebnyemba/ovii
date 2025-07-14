"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-20
Description: URL patterns for the users app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserProfileView, UserViewSet, OTPRequestView, OTPVerificationView, SetTransactionPINView, KYCDocumentViewSet
from . import consumers

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'manage', UserViewSet, basename='user-manage')
router.register(r'kyc-documents', KYCDocumentViewSet, basename='kyc-document')

urlpatterns = [
    # OTP Authentication Endpoints
    path('otp/request/', OTPRequestView.as_view(), name='otp-request'),
    path('otp/verify/', OTPVerificationView.as_view(), name='otp-verify'),

    # Authenticated User Endpoints
    path('me/', UserProfileView.as_view(), name='user-profile'),
    path('me/set-pin/', SetTransactionPINView.as_view(), name='user-set-pin'),

    # Include the admin management URLs from the router.
    path('', include(router.urls)),
]

websocket_urlpatterns = [
    # Endpoint for the notification WebSocket. e.g., /ws/users/notifications/
    path('ws/users/notifications/', consumers.NotificationConsumer.as_asgi()),
]