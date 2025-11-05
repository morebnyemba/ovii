"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: URL patterns for the merchants app.
"""

from django.urls import path
from .views import MerchantProfileView, RegenerateAPIKeyView, MerchantRequestPaymentView

urlpatterns = [
    path("profile/", MerchantProfileView.as_view(), name="merchant-profile"),
    path(
        "profile/regenerate-key/",
        RegenerateAPIKeyView.as_view(),
        name="merchant-regenerate-key",
    ),
    path(
        "request-payment/",
        MerchantRequestPaymentView.as_view(),
        name="merchant-request-payment",
    ),
]
