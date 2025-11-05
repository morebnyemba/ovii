from rest_framework.views import APIView
from rest_framework.response import Response
from django.middleware.csrf import get_token


class CSRFTokenView(APIView):
    """
    A simple view to provide a CSRF token to the frontend.
    The act of making a GET request to this view will set the csrftoken cookie.
    """

    def get(self, request, *args, **kwargs):
        return Response({"detail": "CSRF cookie set"})
