"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-12-10
Description: Models for third-party integrations including WhatsApp configuration.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError


class WhatsAppConfig(models.Model):
    """
    Stores WhatsApp Business Cloud API configuration.
    Only one active configuration is allowed at a time.
    """
    
    waba_id = models.CharField(
        _("WhatsApp Business Account ID"),
        max_length=255,
        blank=True,
        help_text=_("WhatsApp Business Account ID (WABA ID) from Meta Business Manager. Required for template sync.")
    )
    phone_number_id = models.CharField(
        _("Phone Number ID"),
        max_length=255,
        help_text=_("WhatsApp Business Account Phone Number ID from Meta Business Manager")
    )
    access_token = models.CharField(
        _("Access Token"),
        max_length=500,
        help_text=_("WhatsApp Business API Access Token from Meta for Developers")
    )
    api_version = models.CharField(
        _("API Version"),
        max_length=20,
        default="v18.0",
        help_text=_("WhatsApp API Version (e.g., v18.0, v19.0)")
    )
    webhook_verify_token = models.CharField(
        _("Webhook Verify Token"),
        max_length=255,
        blank=True,
        help_text=_("Webhook Verification Token set in Meta developer console")
    )
    is_active = models.BooleanField(
        _("Active"),
        default=True,
        help_text=_("Only one configuration can be active at a time")
    )
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Updated At"), auto_now=True)

    class Meta:
        verbose_name = _("WhatsApp Configuration")
        verbose_name_plural = _("WhatsApp Configurations")
        ordering = ["-created_at"]

    def __str__(self):
        return f"WhatsApp Config (Phone ID: {self.phone_number_id[:15]}...)"

    def clean(self):
        """Ensure only one active configuration exists."""
        if self.is_active:
            # Check if there's another active configuration
            active_configs = WhatsAppConfig.objects.filter(is_active=True)
            if self.pk:
                active_configs = active_configs.exclude(pk=self.pk)
            if active_configs.exists():
                raise ValidationError(
                    _("Only one WhatsApp configuration can be active at a time. "
                      "Please deactivate the current configuration first.")
                )

    def save(self, *args, **kwargs):
        """Override save to ensure validation."""
        self.full_clean()
        super().save(*args, **kwargs)


class WhatsAppTemplate(models.Model):
    """
    Tracks WhatsApp message templates and their sync status with Meta.
    """
    
    STATUS_CHOICES = [
        ('PENDING', _('Pending')),
        ('APPROVED', _('Approved')),
        ('REJECTED', _('Rejected')),
        ('DISABLED', _('Disabled')),
    ]
    
    name = models.CharField(
        _("Template Name"),
        max_length=512,
        help_text=_("Name of the template")
    )
    category = models.CharField(
        _("Category"),
        max_length=50,
        help_text=_("Template category (AUTHENTICATION, MARKETING, UTILITY)")
    )
    language = models.CharField(
        _("Language"),
        max_length=10,
        default="en",
        help_text=_("Template language code (e.g., en, en_US)")
    )
    status = models.CharField(
        _("Status"),
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING',
        help_text=_("Template approval status in Meta")
    )
    template_id = models.CharField(
        _("Meta Template ID"),
        max_length=255,
        blank=True,
        null=True,
        help_text=_("Template ID returned by Meta after creation")
    )
    last_synced_at = models.DateTimeField(
        _("Last Synced At"),
        blank=True,
        null=True,
        help_text=_("Last time this template was synced with Meta")
    )
    rejection_reason = models.TextField(
        _("Rejection Reason"),
        blank=True,
        help_text=_("Reason for rejection if template was rejected by Meta")
    )
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Updated At"), auto_now=True)
    
    class Meta:
        verbose_name = _("WhatsApp Template")
        verbose_name_plural = _("WhatsApp Templates")
        ordering = ["-created_at"]
        unique_together = [['name', 'language']]
    
    def __str__(self):
        return f"{self.name} ({self.language}) - {self.status}"
