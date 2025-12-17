#!/bin/sh

# This script ensures that the directories used for volumes exist.
mkdir -p /home/app/web/staticfiles /home/app/web/mediafiles

# Create any additional static directories specified in STATICFILES_DIRS environment variable
# This prevents Django warnings about non-existent directories
if [ -n "$STATICFILES_DIRS" ]; then
    # Split by comma and create each directory
    echo "$STATICFILES_DIRS" | tr ',' '\n' | while read -r dir; do
        # Trim whitespace and create directory if not empty
        dir=$(echo "$dir" | tr -d ' ')
        if [ -n "$dir" ]; then
            mkdir -p "$dir"
            echo "Created static directory: $dir"
        fi
    done
fi

# Execute the command passed to the container (e.g., from docker-compose.yml)
exec "$@"