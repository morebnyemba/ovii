"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: URL patterns for the merchants app.
"""

from django.urls import path
from .views import MerchantPaymentRequestView, MerchantProfileView, RegenerateAPIKeyView

urlpatterns = [
    path('request-payment/', MerchantPaymentRequestView.as_view(), name='merchant-request-payment'),
    path('profile/', MerchantProfileView.as_view(), name='merchant-profile'),
    path('profile/regenerate-key/', RegenerateAPIKeyView.as_view(), name='merchant-regenerate-key'),
]