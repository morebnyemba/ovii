from django.contrib import admin
from django.contrib import messages
from .models import Merchant
from users.models import OviiUser
from users.tasks import send_realtime_notification


@admin.register(Merchant)
class MerchantAdmin(admin.ModelAdmin):
    list_display = ("user", "business_name", "api_key", "is_approved", "created_at")
    list_filter = ("is_approved", "created_at")
    search_fields = ("user__phone_number", "business_name")
    actions = ["approve_merchants"]
    readonly_fields = ("api_key",)
    raw_id_fields = ("user",)
    ordering = ("-created_at",)

    @admin.action(description="Approve selected merchants and set their role")
    def approve_merchants(self, request, queryset):
        """
        Custom admin action to approve a new merchant. It sets the merchant's
        `is_approved` flag to True and updates the associated user's role
        to 'MERCHANT'.
        """
        approved_count = 0
        already_approved_count = 0

        for merchant in queryset.select_related("user"):
            if merchant.is_approved and merchant.user.role == OviiUser.Role.MERCHANT:
                already_approved_count += 1
                continue

            merchant.is_approved = True
            merchant.user.role = OviiUser.Role.MERCHANT
            merchant.save(update_fields=["is_approved"])
            merchant.user.save(update_fields=["role"])

            send_realtime_notification.delay(
                merchant.user.id,
                "Congratulations! Your merchant account has been approved and is now active.",
            )
            approved_count += 1

        if approved_count > 0:
            self.message_user(
                request,
                f"{approved_count} merchants were successfully approved and activated.",
            )
        if already_approved_count > 0:
            self.message_user(
                request,
                f"{already_approved_count} merchants were already approved.",
                level=messages.WARNING,
            )
