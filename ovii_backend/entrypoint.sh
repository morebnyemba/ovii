#!/bin/sh

# This script ensures that the directories used for volumes are owned by the 'app' user.
# It runs as root when the container starts, before the main application command is executed.

chown -R app:app /home/app/web/logs /home/app/web/staticfiles /home/app/web/mediafiles

# Drop privileges and execute the command passed to the container (e.g., from docker-compose.yml)
# This ensures the application itself runs as the non-root 'app' user.
exec su-exec app "$@"