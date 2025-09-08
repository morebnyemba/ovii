#!/bin/sh

# This script is the entrypoint for the Django application container.
# It's run as root to perform initial setup before dropping privileges.

# Exit immediately if a command exits with a non-zero status.
set -e

# Change ownership of the mounted volumes to the application user.
# This is necessary because named volumes are mounted as root, but the
# application runs as a non-root user ('appuser').
echo "Updating permissions for logs and media directories..."
chown -R appuser:appgroup /home/app/web/logs
chown -R appuser:appgroup /home/app/web/mediafiles

# It's also good practice to ensure the static files directory is owned correctly.
chown -R appuser:appgroup /home/app/web/staticfiles

echo "Permissions updated. Starting application..."

# Now, drop privileges from root to 'appuser' and execute the main command
# passed to this script (e.g., daphne, celery, etc.).
exec su-exec appuser "$@"