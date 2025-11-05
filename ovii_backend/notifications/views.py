from rest_framework import viewsets, permissions
from .models import Notification
from .serializers import NotificationSerializer
from . import tasks


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(recipient=self.request.user)

    def perform_create(self, serializer):
        notification = serializer.save(recipient=self.request.user)
        if notification.channel == Notification.Channel.EMAIL:
            tasks.send_email_task.delay(notification.id)
        elif notification.channel == Notification.Channel.SMS:
            tasks.send_sms_task.delay(notification.id)
        elif notification.channel == Notification.Channel.PUSH:
            tasks.send_push_task.delay(notification.id)
