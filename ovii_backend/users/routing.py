"""
Author: Moreblessing Nyemba +263787211325
Date: 2025-07-21
Description: WebSocket routing configuration for the users app.
"""

from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/users/notifications/', consumers.NotificationConsumer.as_asgi()),
]