from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer
from . import tasks


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter notifications to only show the authenticated user's notifications."""
        return self.queryset.filter(recipient=self.request.user)

    def perform_create(self, serializer):
        notification = serializer.save(recipient=self.request.user)
        if notification.channel == Notification.Channel.EMAIL:
            tasks.send_email_task.delay(notification.id)
        elif notification.channel == Notification.Channel.SMS:
            tasks.send_sms_task.delay(notification.id)
        elif notification.channel == Notification.Channel.PUSH:
            tasks.send_push_task.delay(notification.id)
        elif notification.channel == Notification.Channel.IN_APP:
            tasks.send_in_app_task.delay(notification.id)

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        """Mark all unread notifications for the authenticated user as read."""
        updated_count = self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response(
            {"message": f"Marked {updated_count} notifications as read."},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        """Get the count of unread notifications for the authenticated user."""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({"unread_count": count}, status=status.HTTP_200_OK)
