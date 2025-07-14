"""
ASGI config for ovii_backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

This file configures the top-level protocol router for Channels, which directs
incoming connections to the appropriate consumer based on the protocol type
(HTTP or WebSocket).
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from users.middleware import JwtAuthMiddleware
from users.urls import websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ovii_backend.settings')

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        JwtAuthMiddleware(URLRouter(websocket_urlpatterns))
    ),
})