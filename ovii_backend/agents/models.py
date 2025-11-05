"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: Defines models for the agents app.
"""

from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class Agent(models.Model):
    """
    Represents an Agent in the system, linked to an OviiUser.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="agent_profile",
    )
    agent_code = models.CharField(
        _("agent code"),
        max_length=20,
        unique=True,
        help_text=_("Unique code identifying the agent."),
    )
    business_name = models.CharField(_("business name"), max_length=255)
    location = models.CharField(
        _("location"),
        max_length=255,
        help_text=_("Physical location or area of operation."),
    )
    commission_rate = models.DecimalField(
        _("commission rate"),
        max_digits=5,
        decimal_places=2,
        default=0.00,
        help_text=_("Commission rate for the agent."),
    )
    is_approved = models.BooleanField(
        default=False,
        help_text=_("Designates whether the agent is approved and active."),
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Agent: {self.user.phone_number} ({self.business_name})"
