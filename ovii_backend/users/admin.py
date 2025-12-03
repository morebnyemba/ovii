from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

from .models import (
    OviiUser,
    KYCDocument,
    OTPRequest,
    VerificationLevels,
    DocumentStatus,
    Referral,
)
from .tasks import send_realtime_notification


@admin.register(OviiUser)
class OviiUserAdmin(UserAdmin):
    """
    Admin configuration for the custom OviiUser model.

    This class customizes the Django admin interface for the OviiUser model,
    ensuring that all fields are displayed and editable in a structured way.
    It inherits from UserAdmin to leverage Django's built-in user management features.
    """

    # Fields to display in the user list view.
    # We include custom fields like 'phone_number' for quick reference.
    list_display = (
        "phone_number",
        "email",
        "first_name",
        "last_name",
        "id_number",
        "is_staff",
        "verification_level",
        "referral_code",
    )
    # Register the custom admin action.
    actions = ["approve_identity_verification", "approve_address_verification"]

    # Add filters to the admin list view for easier user management.
    list_filter = ("is_staff", "is_active", "verification_level")

    # Fields that can be searched in the admin list view.
    search_fields = ("phone_number", "email", "first_name", "last_name", "id_number", "referral_code")

    # Default ordering for the user list.
    ordering = ("phone_number",)

    # The 'fieldsets' attribute customizes the layout of the user edit page.
    # We replace the default 'username' field with 'email' and add our custom fields.
    fieldsets = (
        # The first section handles authentication details.
        (None, {"fields": ("phone_number", "password")}),
        # 'Personal info' includes standard and custom user details.
        (
            _("Personal info"),
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "email",
                    "id_number",
                    "date_of_birth",
                    "gender",
                    "profile_picture",
                )
            },
        ),
        (
            _("Address Information"),
            {
                "fields": (
                    "address_line_1",
                    "address_line_2",
                    "city",
                    "postal_code",
                    "country",
                )
            },
        ),
        # 'Permissions' section is inherited from UserAdmin, with fintech fields added.
        (
            _("Permissions & Status"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                    "verification_level",
                    "has_set_pin",
                )
            },
        ),
        # Referral information section
        (
            _("Referral Information"),
            {
                "fields": (
                    "referral_code",
                    "referred_by",
                )
            },
        ),
        # 'Important dates' section is also inherited.
        (_("Important dates"), {"fields": ("last_login", "date_joined")}),
    )

    # The 'add_fieldsets' customizes the user creation form.
    # We define the fields for creating a user in the admin.
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "phone_number",
                    "email",
                    "password",
                    "password2",
                    "is_staff",
                    "is_superuser",
                ),
            },
        ),
    )

    @admin.action(description="Approve ID documents and upgrade users to Level 2")
    def approve_identity_verification(self, request, queryset):
        """
        Custom admin action to approve a user's pending ID document and
        upgrade their verification level.
        """
        upgraded_count = 0
        skipped_count = 0
        no_doc_count = 0

        for user in queryset:
            if user.verification_level != VerificationLevels.LEVEL_1:
                skipped_count += 1
                continue

            # Find the user's pending ID card document
            pending_doc = user.kyc_documents.filter(
                document_type=KYCDocument.DocumentType.ID_CARD,
                status=DocumentStatus.PENDING,
            ).first()

            if pending_doc:
                pending_doc.status = DocumentStatus.APPROVED
                pending_doc.reviewed_at = timezone.now()
                pending_doc.save()

                user.verification_level = VerificationLevels.LEVEL_2
                user.save(update_fields=["verification_level"])

                send_realtime_notification.delay(
                    user.id,
                    "Congratulations! Your identity document has been approved.",
                )
                upgraded_count += 1
            else:
                no_doc_count += 1

        if upgraded_count > 0:
            self.message_user(
                request,
                f"{upgraded_count} users were successfully upgraded to Level 2.",
            )
        if skipped_count > 0:
            self.message_user(
                request,
                f"{skipped_count} users were skipped (not at Level 1).",
                level="WARNING",
            )
        if no_doc_count > 0:
            self.message_user(
                request,
                f"{no_doc_count} users were skipped (no pending ID document found).",
                level="ERROR",
            )

    @admin.action(description="Approve address documents and upgrade users to Level 3")
    def approve_address_verification(self, request, queryset):
        """
        Custom admin action to approve a user's pending address document (e.g., utility bill)
        and upgrade their verification level to the highest tier.
        """
        # Ensure we only try to upgrade users from the correct level.
        upgradable_users = queryset.filter(
            verification_level=VerificationLevels.LEVEL_2
        )

        upgraded_count = 0
        for user in upgradable_users:
            # Find the user's pending utility bill document
            pending_doc = user.kyc_documents.filter(
                document_type=KYCDocument.DocumentType.UTILITY_BILL,
                status=DocumentStatus.PENDING,
            ).first()

            if pending_doc:
                pending_doc.status = DocumentStatus.APPROVED
                pending_doc.reviewed_at = timezone.now()
                pending_doc.save()

                user.verification_level = VerificationLevels.LEVEL_3
                user.save(update_fields=["verification_level"])
                send_realtime_notification.delay(
                    user.id, "Your address has been verified! You now have full access."
                )
                upgraded_count += 1

        self.message_user(
            request, f"{upgraded_count} users were successfully upgraded to Level 3."
        )


@admin.register(KYCDocument)
class KYCDocumentAdmin(admin.ModelAdmin):
    """Admin configuration for KYC documents."""

    list_display = ("user", "document_type", "status", "uploaded_at", "reviewed_at")
    list_filter = ("status", "document_type", "uploaded_at")
    search_fields = (
        "user__phone_number",
        "user__email",
        "user__first_name",
        "user__last_name",
    )
    readonly_fields = ("uploaded_at", "reviewed_at")
    # Use a search widget for the user field for better performance with many users.
    raw_id_fields = ("user",)


@admin.register(OTPRequest)
class OTPRequestAdmin(admin.ModelAdmin):
    """Admin configuration for OTP requests, useful for support and debugging."""

    list_display = (
        "phone_number",
        "code",
        "created_at",
        "expires_at",
        "is_expired_status",
    )
    readonly_fields = ("phone_number", "code", "created_at", "expires_at")
    search_fields = ("phone_number",)

    @admin.display(boolean=True, description="Is Expired?")
    def is_expired_status(self, obj):
        """Custom method to display the expiration status in the admin list."""
        return obj.is_expired()


@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    """Admin configuration for referrals."""

    list_display = (
        "referrer",
        "referred",
        "referral_code",
        "referrer_bonus",
        "referred_bonus",
        "bonus_status",
        "created_at",
        "credited_at",
    )
    list_filter = ("bonus_status", "created_at", "credited_at")
    search_fields = (
        "referrer__phone_number",
        "referrer__email",
        "referred__phone_number",
        "referred__email",
        "referral_code",
    )
    readonly_fields = ("created_at", "credited_at")
    raw_id_fields = ("referrer", "referred")
    actions = ["credit_referral_bonuses"]

    @admin.action(description="Credit pending referral bonuses")
    def credit_referral_bonuses(self, request, queryset):
        """
        Admin action to credit pending referral bonuses.
        This would integrate with the wallet system in a production environment.
        """
        credited_count = 0
        for referral in queryset.filter(bonus_status=Referral.BonusStatus.PENDING):
            # In production, this would credit the wallet and create transactions
            # For now, we just mark it as credited
            referral.bonus_status = Referral.BonusStatus.CREDITED
            referral.credited_at = timezone.now()
            referral.save(update_fields=["bonus_status", "credited_at"])
            credited_count += 1

        self.message_user(
            request, f"{credited_count} referral bonuses were credited successfully."
        )
