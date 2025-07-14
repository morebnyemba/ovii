"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-20
Description: Defines custom middleware for Django Channels.
"""

from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .models import OviiUser


@database_sync_to_async
def get_user(token_key):
    """
    Asynchronously retrieves a user based on a JWT access token.
    Returns AnonymousUser if the token is invalid or the user doesn't exist.
    """
    try:
        token = AccessToken(token_key)
        user_id = token.get('user_id')
        return OviiUser.objects.get(id=user_id)
    except (InvalidToken, TokenError, OviiUser.DoesNotExist):
        return AnonymousUser()


class JwtAuthMiddleware:
    """
    Custom middleware for Django Channels to authenticate users via JWT
    passed in the WebSocket connection's query string.
    """
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        scope['user'] = await get_user(token) if token else AnonymousUser()
        return await self.app(scope, receive, send)