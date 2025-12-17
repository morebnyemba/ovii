#!/bin/sh

# This script ensures that the directories used for volumes exist.
mkdir -p /home/app/web/staticfiles /home/app/web/mediafiles

# Create any additional static directories specified in STATICFILES_DIRS environment variable
# This prevents Django warnings about non-existent directories
if [ -n "$STATICFILES_DIRS" ]; then
    # Save IFS and set it to comma for splitting
    OLD_IFS="$IFS"
    IFS=','
    
    # Split STATICFILES_DIRS by comma and iterate
    for dir in $STATICFILES_DIRS; do
        # Trim leading and trailing whitespace using parameter expansion
        dir="${dir#"${dir%%[![:space:]]*}"}"  # Remove leading whitespace
        dir="${dir%"${dir##*[![:space:]]}"}"  # Remove trailing whitespace
        
        # Create directory if not empty
        if [ -n "$dir" ]; then
            mkdir -p "$dir"
            echo "Created static directory: $dir"
        fi
    done
    
    # Restore IFS
    IFS="$OLD_IFS"
fi

# Execute the command passed to the container (e.g., from docker-compose.yml)
exec "$@"