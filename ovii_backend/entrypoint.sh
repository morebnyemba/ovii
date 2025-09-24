#!/bin/sh

# This script ensures that the directories used for volumes exist.
mkdir -p /home/app/web/staticfiles /home/app/web/mediafiles

# Execute the command passed to the container (e.g., from docker-compose.yml)
exec "$@"