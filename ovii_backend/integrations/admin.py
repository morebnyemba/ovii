"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-12-10
Description: Admin configuration for integrations app.
"""

from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import WhatsAppConfig


@admin.register(WhatsAppConfig)
class WhatsAppConfigAdmin(admin.ModelAdmin):
    """Admin interface for WhatsApp configuration."""
    
    list_display = [
        "phone_number_id_display",
        "api_version",
        "is_active",
        "created_at",
        "updated_at"
    ]
    list_filter = ["is_active", "created_at", "api_version"]
    search_fields = ["phone_number_id", "api_version"]
    readonly_fields = ["created_at", "updated_at"]
    
    fieldsets = (
        (_("WhatsApp API Credentials"), {
            "fields": ("phone_number_id", "access_token", "api_version")
        }),
        (_("Webhook Configuration"), {
            "fields": ("webhook_verify_token",)
        }),
        (_("Status"), {
            "fields": ("is_active",)
        }),
        (_("Timestamps"), {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )
    
    def phone_number_id_display(self, obj):
        """Display truncated phone number ID for security."""
        if len(obj.phone_number_id) > 20:
            return f"{obj.phone_number_id[:15]}..."
        return obj.phone_number_id
    phone_number_id_display.short_description = "Phone Number ID"
    
    def has_delete_permission(self, request, obj=None):
        """
        Allow deletion only if:
        - The config is inactive, OR
        - There's at least one other active configuration
        """
        if obj and obj.is_active:
            # Check if there are other active configurations
            active_count = WhatsAppConfig.objects.filter(is_active=True).count()
            return active_count > 1
        return True
