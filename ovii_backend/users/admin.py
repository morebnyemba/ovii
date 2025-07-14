from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

from .models import OviiUser, KYCDocument, VerificationLevels, DocumentStatus
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
    list_display = ('phone_number', 'email', 'first_name', 'last_name', 'id_number', 'is_staff', 'verification_level')
    # Register the custom admin action.
    actions = ['approve_identity_verification', 'approve_address_verification']

    # Add filters to the admin list view for easier user management.
    list_filter = ('is_staff', 'is_active', 'verification_level')

    # Fields that can be searched in the admin list view.
    search_fields = ('phone_number', 'email', 'first_name', 'last_name', 'id_number')

    # Default ordering for the user list.
    ordering = ('phone_number',)

    # The 'fieldsets' attribute customizes the layout of the user edit page.
    # We replace the default 'username' field with 'email' and add our custom fields.
    fieldsets = (
        # The first section handles authentication details.
        (None, {'fields': ('phone_number', 'password')}),
        # 'Personal info' includes standard and custom user details.
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'email', 'id_number', 'date_of_birth', 'gender', 'profile_picture')}),
        (_('Address Information'), {'fields': ('address_line_1', 'address_line_2', 'city', 'postal_code', 'country')}),
        # 'Permissions' section is inherited from UserAdmin, with fintech fields added.
        (_('Permissions & Status'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions', 'verification_level', 'has_set_pin')
        }),
        # 'Important dates' section is also inherited.
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )

    # The 'add_fieldsets' customizes the user creation form.
    # We define the fields for creating a user in the admin.
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('phone_number', 'email', 'password', 'password2', 'is_staff', 'is_superuser'),
        }),
    )

    @admin.action(description='Approve ID documents and upgrade users to Level 2')
    def approve_identity_verification(self, request, queryset):
        """
        Custom admin action to approve a user's pending ID document and
        upgrade their verification level.
        """
        # Ensure we only try to upgrade users from the correct level.
        upgradable_users = queryset.filter(verification_level=VerificationLevels.LEVEL_1)

        upgraded_count = 0
        for user in upgradable_users:
            # Find the user's pending ID card document
            pending_doc = user.kyc_documents.filter(
                document_type=KYCDocument.DocumentType.ID_CARD,
                status=DocumentStatus.PENDING
            ).first()

            if pending_doc:
                pending_doc.status = DocumentStatus.APPROVED
                pending_doc.reviewed_at = timezone.now()
                pending_doc.save()

                user.verification_level = VerificationLevels.LEVEL_2
                user.save(update_fields=['verification_level'])

                send_realtime_notification.delay(
                    user.id,
                    "Congratulations! Your identity document has been approved."
                )
                upgraded_count += 1

        self.message_user(request, f'{upgraded_count} users were successfully upgraded to Level 2.')

    @admin.action(description='Approve address documents and upgrade users to Level 3')
    def approve_address_verification(self, request, queryset):
        """
        Custom admin action to approve a user's pending address document (e.g., utility bill)
        and upgrade their verification level to the highest tier.
        """
        # Ensure we only try to upgrade users from the correct level.
        upgradable_users = queryset.filter(verification_level=VerificationLevels.LEVEL_2)

        upgraded_count = 0
        for user in upgradable_users:
            # Find the user's pending utility bill document
            pending_doc = user.kyc_documents.filter(
                document_type=KYCDocument.DocumentType.UTILITY_BILL,
                status=DocumentStatus.PENDING
            ).first()

            if pending_doc:
                pending_doc.status = DocumentStatus.APPROVED
                pending_doc.reviewed_at = timezone.now()
                pending_doc.save()

                user.verification_level = VerificationLevels.LEVEL_3
                user.save(update_fields=['verification_level'])
                send_realtime_notification.delay(user.id, "Your address has been verified! You now have full access.")
                upgraded_count += 1

        self.message_user(request, f'{upgraded_count} users were successfully upgraded to Level 3.')
