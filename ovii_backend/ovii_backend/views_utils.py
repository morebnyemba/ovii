from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.middleware.csrf import get_token
from django.db import connections
from django.db.utils import OperationalError


class HealthCheckView(APIView):
    """
    Lightweight health endpoint for load balancers and uptime monitors.
    Returns 200 when the app is serving and the database is reachable,
    503 when the database is down.
    """

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = []

    def get(self, request, *args, **kwargs):
        try:
            connections["default"].ensure_connection()
        except OperationalError:
            return Response(
                {"status": "unhealthy", "database": "unreachable"}, status=503
            )
        return Response({"status": "ok", "database": "ok"})


class CSRFTokenView(APIView):
    """
    A simple view to provide a CSRF token to the frontend.
    The act of making a GET request to this view will set the csrftoken cookie.
    """

    def get(self, request, *args, **kwargs):
        return Response({"detail": "CSRF cookie set"})
