from django.contrib import admin
from django.shortcuts import render
from django.http import HttpResponseRedirect
from django.urls import path
from django.db import transaction
from django.contrib import messages

from .models import Wallet, Transaction, TransactionCharge, SystemWallet
from .forms import WalletTopUpForm
from .services import create_compensation_transaction, TransactionError


@admin.register(SystemWallet)
class SystemWalletAdmin(admin.ModelAdmin):
    list_display = ('name', 'balance')
    search_fields = ('name',)


@admin.register(TransactionCharge)
class TransactionChargeAdmin(admin.ModelAdmin):
    list_display = ('name', 'charge_type', 'value', 'applies_to', 'is_active')
    list_filter = ('charge_type', 'applies_to', 'is_active')
    search_fields = ('name',)


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    """
    Admin configuration for the Wallet model.
    """

    list_display = ("user", "balance", "currency", "updated_at")
    search_fields = (
        "user__phone_number",
        "user__email",
        "user__first_name",
        "user__last_name",
    )
    list_select_related = ("user",)  # Optimizes query by pre-fetching user data
    actions = ["top_up_wallets_action"]

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "top-up/",
                self.admin_site.admin_view(self.process_top_up),
                name="wallet-top-up",
            ),
        ]
        return custom_urls + urls

    def process_top_up(self, request):
        """
        Processes the amount submitted from the intermediate page.
        """
        form = WalletTopUpForm(request.POST)
        if form.is_valid():
            amount = form.cleaned_data["amount"]
            reason = form.cleaned_data["reason"]
            wallet_ids = request.POST.get("wallet_ids").split(",")

            queryset = Wallet.objects.filter(id__in=wallet_ids)

            with transaction.atomic():
                for wallet in queryset:
                    wallet.balance += amount
                    wallet.save(update_fields=["balance", "updated_at"])

                    # Create a transaction record for this administrative action
                    Transaction.objects.create(
                        wallet=wallet,
                        transaction_type=Transaction.TransactionType.DEPOSIT,
                        amount=amount,
                        status=Transaction.Status.COMPLETED,
                        description=f"Admin top-up: {reason}",
                    )

            self.message_user(
                request,
                f"Successfully topped up {queryset.count()} wallet(s) with ${amount}.",
            )
        else:
            self.message_user(request, "Invalid amount provided.", level=messages.ERROR)

        return HttpResponseRedirect(request.get_full_path("../"))

    @admin.action(description="Top-up selected wallet(s)")
    def top_up_wallets_action(self, request, queryset):
        """
        Admin action that shows an intermediate page to get the top-up amount.
        """
        if queryset.count() == 0:
            self.message_user(request, "No wallets selected.", level=messages.WARNING)
            return

        context = {
            "form": WalletTopUpForm(),
            "wallets": queryset,
            "wallet_ids": ",".join(str(w.id) for w in queryset),
        }
        return render(request, "admin/wallet_top_up_intermediate.html", context)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    """
    Admin configuration for the Transaction model.
    Transactions are immutable — no editing or deletion is permitted.
    Compensation transactions can be created via the admin action.
    """

    list_display = (
        "transaction_reference",
        "wallet",
        "related_wallet",
        "transaction_type",
        "amount",
        "status",
        "is_compensation_display",
        "timestamp",
    )
    list_filter = ("status", "transaction_type")
    search_fields = (
        "transaction_reference",
        "wallet__user__phone_number",
        "related_wallet__user__phone_number",
        "description",
    )
    list_select_related = ("wallet__user", "related_wallet__user", "compensates")
    readonly_fields = (
        "wallet",
        "related_wallet",
        "amount",
        "charge",
        "charge_amount",
        "status",
        "timestamp",
        "transaction_type",
        "transaction_reference",
        "sender_identifier",
        "receiver_identifier",
        "description",
        "compensates",
    )
    actions = ["compensate_transaction_action"]

    @admin.display(description="Compensation", boolean=True)
    def is_compensation_display(self, obj):
        return obj.is_compensation

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.action(description="[COMPENSATION] Reverse selected transaction(s)")
    def compensate_transaction_action(self, request, queryset):
        if queryset.count() != 1:
            self.message_user(
                request,
                "Please select exactly one transaction to compensate.",
                level=messages.WARNING,
            )
            return

        original = queryset.first()
        try:
            comp = create_compensation_transaction(
                original_transaction=original,
                initiated_by=request.user,
                reason="Admin-initiated compensation",
            )
            self.message_user(
                request,
                f"Compensation transaction {comp.transaction_reference} created successfully "
                f"to reverse {original.transaction_reference}.",
            )
        except TransactionError as e:
            self.message_user(request, str(e), level=messages.ERROR)
