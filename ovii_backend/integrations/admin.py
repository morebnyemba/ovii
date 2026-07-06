"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-12-10
Description: Admin configuration for integrations app.
"""

import logging

from django.contrib import admin, messages
from django.utils.translation import gettext_lazy as _
from .models import WhatsAppConfig, WhatsAppTemplate

logger = logging.getLogger(__name__)


@admin.register(WhatsAppConfig)
class WhatsAppConfigAdmin(admin.ModelAdmin):
    """Admin interface for WhatsApp configuration."""
    
    list_display = [
        "waba_id_display",
        "phone_number_id_display",
        "api_version",
        "is_active",
        "created_at",
        "updated_at"
    ]
    list_filter = ["is_active", "created_at", "api_version"]
    search_fields = ["waba_id", "phone_number_id", "api_version"]
    readonly_fields = ["created_at", "updated_at"]
    
    fieldsets = (
        (_("WhatsApp API Credentials"), {
            "fields": ("waba_id", "phone_number_id", "access_token", "api_version")
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
    
    def waba_id_display(self, obj):
        """Display truncated WABA ID for security."""
        if obj.waba_id and len(obj.waba_id) > 20:
            return f"{obj.waba_id[:15]}..."
        return obj.waba_id or "Not set"
    waba_id_display.short_description = "WABA ID"
    
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


@admin.register(WhatsAppTemplate)
class WhatsAppTemplateAdmin(admin.ModelAdmin):
    """Admin interface for WhatsApp template tracking."""
    
    list_display = [
        "name",
        "language",
        "category",
        "status",
        "template_id",
        "last_synced_at",
        "created_at"
    ]
    list_filter = ["status", "category", "language", "created_at", "last_synced_at"]
    search_fields = ["name", "template_id", "rejection_reason"]
    readonly_fields = ["created_at", "updated_at", "components"]
    actions = ["pull_templates_from_meta"]

    fieldsets = (
        (_("Template Information"), {
            "fields": ("name", "category", "language")
        }),
        (_("Sync Status"), {
            "fields": ("status", "template_id", "last_synced_at")
        }),
        (_("Template Content"), {
            "fields": ("components",),
            "classes": ("collapse",)
        }),
        (_("Rejection Details"), {
            "fields": ("rejection_reason",),
            "classes": ("collapse",)
        }),
        (_("Timestamps"), {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )

    def has_add_permission(self, request):
        """Templates are created via management command, not manually."""
        return False

    @admin.action(description=_("Pull all templates from Meta for this WABA"))
    def pull_templates_from_meta(self, request, queryset):
        """Fetch every template on the WABA from Meta and upsert locally.

        The selected rows are ignored — the pull always covers the whole WABA.
        """
        from django.utils import timezone
        from .services import WhatsAppClient

        try:
            client = WhatsAppClient()
            meta_templates = client.list_templates()
        except Exception as e:
            self.message_user(
                request,
                _("Failed to pull templates from Meta: %(error)s") % {"error": e},
                level=messages.ERROR,
            )
            return

        created_count = 0
        updated_count = 0
        failed_count = 0
        now = timezone.now()
        for meta_template in meta_templates:
            name = meta_template.get("name")
            if not name:
                continue
            rejected_reason = meta_template.get("rejected_reason") or ""
            if rejected_reason.upper() == "NONE":
                rejected_reason = ""
            try:
                _obj, created = WhatsAppTemplate.objects.update_or_create(
                    name=name,
                    language=meta_template.get("language") or "en",
                    defaults={
                        "category": meta_template.get("category") or "",
                        "status": (meta_template.get("status") or "PENDING").upper(),
                        "template_id": meta_template.get("id"),
                        "components": meta_template.get("components"),
                        "rejection_reason": rejected_reason[:500],
                        "last_synced_at": now,
                    },
                )
            except Exception as e:
                failed_count += 1
                logger.error(
                    f"Failed to store template '{name}' "
                    f"({meta_template.get('language')}) during admin pull: {e}"
                )
                continue
            if created:
                created_count += 1
            else:
                updated_count += 1

        if failed_count:
            self.message_user(
                request,
                _("Pulled %(total)d template(s) from Meta: %(created)d created, "
                  "%(updated)d updated, %(failed)d failed (see server logs).")
                % {
                    "total": len(meta_templates),
                    "created": created_count,
                    "updated": updated_count,
                    "failed": failed_count,
                },
                level=messages.WARNING,
            )
        else:
            self.message_user(
                request,
                _("Pulled %(total)d template(s) from Meta: %(created)d created, %(updated)d updated.")
                % {"total": len(meta_templates), "created": created_count, "updated": updated_count},
                level=messages.SUCCESS,
            )
