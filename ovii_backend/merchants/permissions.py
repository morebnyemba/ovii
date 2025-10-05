"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: Defines custom permissions for the merchants app.
"""
from rest_framework.permissions import BasePermission
from .models import Merchant


class IsApprovedMerchantAPI(BasePermission):
    """
    Custom permission to only allow approved merchants via API Key authentication.
    Expects the key to be provided in the 'Authorization' header.
    Format: `Authorization: Api-Key <your_api_key>`
    """
    message = 'Invalid or missing API Key. You must be an approved merchant to perform this action.'

    def has_permission(self, request, view):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.lower().startswith('api-key '):
            return False

        api_key = auth_header.split(' ')[1]
        try:
            merchant = Merchant.objects.select_related('user__wallet').get(api_key=api_key, is_approved=True)
            # Attach the merchant and their user/wallet to the request for easy access in the view.
            request.merchant = merchant
            request.user = merchant.user
            return True
        except Merchant.DoesNotExist:
            return False