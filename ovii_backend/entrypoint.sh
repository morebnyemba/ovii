#!/bin/sh

# This script ensures that the directories used for volumes exist.
# Note: /home/app/web/static is not needed as Django checks for it conditionally
mkdir -p /home/app/web/staticfiles /home/app/web/mediafiles

# Execute the command passed to the container (e.g., from docker-compose.yml)
exec "$@"