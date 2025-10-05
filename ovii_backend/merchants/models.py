"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: Defines models for the merchants app.
"""
import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class Merchant(models.Model):
    """
    Represents a Merchant in the system, linked to an OviiUser.
    This model stores business details and credentials for API access.
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True, related_name='merchant_profile')
    business_name = models.CharField(_('business name'), max_length=255)
    api_key = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    webhook_url = models.URLField(_('webhook URL'), blank=True, help_text=_("URL to send payment notifications to."))
    is_approved = models.BooleanField(default=False, help_text=_("Designates whether the merchant is approved and can accept payments."))
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Merchant: {self.user.phone_number} ({self.business_name})"

    def regenerate_api_key(self):
        """Generates a new API key for the merchant."""
        self.api_key = uuid.uuid4()
        self.save(update_fields=['api_key'])