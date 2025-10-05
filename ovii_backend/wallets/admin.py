from django.contrib import admin
from django.shortcuts import render
from django.http import HttpResponseRedirect
from django.urls import path
from django.db import transaction
from django.contrib import messages

from .models import Wallet, Transaction
from .forms import WalletTopUpForm


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    """
    Admin configuration for the Wallet model.
    """
    list_display = ('user', 'balance', 'currency', 'updated_at')
    search_fields = ('user__phone_number', 'user__email', 'user__first_name', 'user__last_name')
    list_select_related = ('user',)  # Optimizes query by pre-fetching user data
    actions = ['top_up_wallets_action']

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                'top-up/',
                self.admin_site.admin_view(self.process_top_up),
                name='wallet-top-up',
            ),
        ]
        return custom_urls + urls

    def process_top_up(self, request):
        """
        Processes the amount submitted from the intermediate page.
        """
        form = WalletTopUpForm(request.POST)
        if form.is_valid():
            amount = form.cleaned_data['amount']
            reason = form.cleaned_data['reason']
            wallet_ids = request.POST.get('wallet_ids').split(',')

            queryset = Wallet.objects.filter(id__in=wallet_ids)
            
            with transaction.atomic():
                for wallet in queryset:
                    wallet.balance += amount
                    wallet.save(update_fields=['balance', 'updated_at'])

                    # Create a transaction record for this administrative action
                    Transaction.objects.create(
                        wallet=wallet,
                        transaction_type=Transaction.TransactionType.DEPOSIT,
                        amount=amount,
                        status=Transaction.Status.COMPLETED,
                        description=f"Admin top-up: {reason}"
                    )

            self.message_user(request, f"Successfully topped up {queryset.count()} wallet(s) with ${amount}.")
        else:
            self.message_user(request, "Invalid amount provided.", level=messages.ERROR)

        return HttpResponseRedirect(request.get_full_path("../"))

    @admin.action(description='Top-up selected wallet(s)')
    def top_up_wallets_action(self, request, queryset):
        """
        Admin action that shows an intermediate page to get the top-up amount.
        """
        if queryset.count() == 0:
            self.message_user(request, "No wallets selected.", level=messages.WARNING)
            return

        context = {
            'form': WalletTopUpForm(),
            'wallets': queryset,
            'wallet_ids': ",".join(str(w.id) for w in queryset),
        }
        return render(request, 'admin/wallet_top_up_intermediate.html', context)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    """
    Admin configuration for the Transaction model.
    """
    list_display = ('wallet', 'related_wallet', 'transaction_type', 'amount', 'status', 'timestamp')
    list_filter = ('status', 'transaction_type')
    search_fields = ('wallet__user__phone_number', 'related_wallet__user__phone_number', 'description')
    list_select_related = ('wallet__user', 'related_wallet__user')
    readonly_fields = ('wallet', 'related_wallet', 'amount', 'status', 'timestamp', 'transaction_type', 'description')

    def has_add_permission(self, request):
        # Transactions should only be created via the API, not the admin.
        return False
