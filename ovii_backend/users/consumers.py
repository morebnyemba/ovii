"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-20
Description: Defines WebSocket consumers for the users app.
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    A WebSocket consumer for handling user notifications.

    It authenticates the user on connection and adds them to a
    user-specific group to receive targeted notifications.
    """
    async def connect(self):
        self.user = self.scope['user']

        if self.user.is_anonymous:
            # Reject unauthenticated connections
            await self.close()
        else:
            # Join a private group for this user
            self.room_group_name = f'user_{self.user.id}_notifications'
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()

    async def disconnect(self, close_code):
        # Only attempt to leave the group if the user was authenticated and joined one.
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def user_notification(self, event):
        """Handler for messages sent to the user's group."""
        message = event['message']
        await self.send(text_data=json.dumps({'message': message}))