from django.contrib import admin
from .models import Wallet, Transaction


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    """
    Admin configuration for the Wallet model.
    """
    list_display = ('user', 'balance', 'currency', 'updated_at')
    search_fields = ('user__phone_number', 'user__email', 'user__first_name', 'user__last_name')
    list_select_related = ('user',) # Optimizes query by pre-fetching user data


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    """
    Admin configuration for the Transaction model.
    Provides a read-only view of transaction history.
    """
    list_display = ('source_wallet', 'destination_wallet', 'amount', 'status', 'timestamp')
    list_filter = ('status',)
    search_fields = (
        'source_wallet__user__phone_number',
        'destination_wallet__user__phone_number'
    )
    list_select_related = ('source_wallet__user', 'destination_wallet__user')
    readonly_fields = ('source_wallet', 'destination_wallet', 'amount', 'status', 'timestamp')

    def has_add_permission(self, request):
        # Transactions should only be created via the API, not the admin.
        return False
