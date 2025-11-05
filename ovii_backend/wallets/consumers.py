import json
from channels.generic.websocket import AsyncWebsocketConsumer


class WalletConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """
        Called when the websocket is trying to connect.
        Authenticates the user and joins them to a user-specific group.
        """
        self.user = self.scope["user"]

        if not self.user.is_authenticated:
            await self.close()
            return

        # Create a unique group name for each user
        self.room_group_name = f"user_{self.user.id}_wallet"

        # Join the user-specific group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        await self.accept()
        print(f"User {self.user.id} connected to wallet socket.")

    async def disconnect(self, close_code):
        """
        Called when the websocket disconnects.
        """
        # Only attempt to leave the group if the user was authenticated and joined one.
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(
                self.room_group_name, self.channel_name
            )
            print(f"User {self.user.id} disconnected from wallet socket.")

    async def wallet_update(self, event):
        """
        Handler for messages sent to the user's group.
        """
        await self.send(text_data=json.dumps(event["data"]))
