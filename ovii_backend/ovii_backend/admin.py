from django.contrib import admin
from .models import Merchant

@admin.register(Merchant)
class MerchantAdmin(admin.ModelAdmin):
    list_display = ('user', 'business_name', 'api_key', 'is_approved', 'created_at')
    list_filter = ('is_approved', 'created_at')
    search_fields = ('user__phone_number', 'business_name')
    readonly_fields = ('api_key',)
    raw_id_fields = ('user',)
    ordering = ('-created_at',)
