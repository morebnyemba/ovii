from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = (
            "id",
            "recipient",
            "channel",
            "target",
            "title",
            "message",
            "is_read",
            "status",
            "created_at",
            "sent_at",
        )
        read_only_fields = ("recipient", "status", "sent_at")
