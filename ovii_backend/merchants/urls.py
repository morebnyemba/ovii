"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: URL patterns for the merchants app.
"""

from django.urls import path
from .views import MerchantPaymentRequestView

urlpatterns = [
    path('request-payment/', MerchantPaymentRequestView.as_view(), name='merchant-request-payment'),
]