import os

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ovii_backend.settings")
# Initialize Django ASGI application early to ensure AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

# Import routing from both apps that have WebSocket consumers
from wallets.routing import websocket_urlpatterns as wallet_ws_urlpatterns
from users.routing import websocket_urlpatterns as user_ws_urlpatterns
from users.middleware import JwtAuthMiddleware

# Combine the WebSocket URL patterns from all relevant apps
combined_ws_urlpatterns = wallet_ws_urlpatterns + user_ws_urlpatterns

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AllowedHostsOriginValidator(
            JwtAuthMiddleware(URLRouter(combined_ws_urlpatterns))
        ),
    }
)
