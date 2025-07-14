"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-20
Description: App configuration for the wallets app.
"""
from django.apps import AppConfig


class WalletsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'wallets'

    def ready(self):
        # Import signals to ensure they are connected when the app is ready.
        import wallets.signals