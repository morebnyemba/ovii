"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-20
Description: Defines signals for the wallets app.
"""

from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Wallet


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_wallet(sender, instance, created, **kwargs):
    """
    A signal that automatically creates a Wallet for a new user upon registration.
    """
    if created:
        Wallet.objects.create(user=instance)