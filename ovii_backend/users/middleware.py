"""
Author: Moreblessing Nyemba +263787211325
Date: 2025-07-21
Description: Custom middleware for Django Channels to handle JWT authentication.
"""

from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

User = get_user_model()


@database_sync_to_async
def get_user(user_id):
    """Asynchronously retrieves a user from the database."""
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return AnonymousUser()


class JwtAuthMiddleware:
    """
    Custom middleware for Django Channels that authenticates users via a JWT
    passed in the WebSocket connection's query string.
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        query_params = parse_qs(scope.get("query_string", b"").decode())
        token = query_params.get("token", [None])[0]

        scope["user"] = AnonymousUser()
        if token:
            try:
                access_token = AccessToken(token)
                scope["user"] = await get_user(access_token["user_id"])
            except (InvalidToken, TokenError):
                pass  # Token is invalid, user remains anonymous

        return await self.app(scope, receive, send)
