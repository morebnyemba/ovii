import logging
import traceback

logger = logging.getLogger(__name__)

class ErrorLoggingMiddleware:
    """
    Middleware that logs unhandled exceptions, including the request body.
    This is crucial for debugging API errors, especially 400 Bad Request
    and 500 Internal Server Error responses.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # The main request-response handling is done in a try block.
        try:
            response = self.get_response(request)
            return response
        except Exception as e:
            # If any unhandled exception occurs, log it before it's
            # processed by Django's exception handling.
            try:
                body = request.body.decode('utf-8')
            except Exception:
                body = "Could not decode request body."

            error_message = (
                f"Unhandled exception: {e}\n"
                f"Request Path: {request.path}\n"
                f"Request Method: {request.method}\n"
                f"Request Body: {body}\n"
                f"Traceback:\n{traceback.format_exc()}"
            )
            logger.error(error_message)

            # Re-raise the exception so Django can continue its normal error handling
            # (e.g., return a 500 response).
            raise
