#!/bin/sh
set -e

# Ensure volume-mounted directories exist before Django tries to use them.
mkdir -p /home/app/web/staticfiles /home/app/web/mediafiles

if [ -n "$STATICFILES_DIRS" ]; then
    OLD_IFS="$IFS"
    IFS=','
    for dir in $STATICFILES_DIRS; do
        dir=$(echo "$dir" | xargs)
        [ -n "$dir" ] && mkdir -p "$dir"
    done
    IFS="$OLD_IFS"
fi

# Wait for the database to be ready before running any management commands.
echo "Waiting for database..."
python -c "
import os, time, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ovii_backend.settings')
django.setup()
from django.db import connections
from django.db.utils import OperationalError
retries = 30
while retries:
    try:
        connections['default'].ensure_connection()
        print('Database is ready.')
        break
    except OperationalError:
        retries -= 1
        print(f'Database not ready, retrying... ({retries} attempts left)')
        time.sleep(2)
else:
    raise SystemExit('Database did not become available in time.')
"

# Apply any pending migrations automatically on startup.
# Only one service (the backend) should run these; celery workers set
# RUN_MIGRATIONS=0 so they don't race the backend on the same migrations.
if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
    echo "Running database migrations..."
    python manage.py migrate --noinput
else
    echo "Skipping migrations (RUN_MIGRATIONS=${RUN_MIGRATIONS})."
fi

# Collect static files into STATIC_ROOT so Nginx / WhiteNoise can serve them.
if [ "${RUN_COLLECTSTATIC:-1}" = "1" ]; then
    echo "Collecting static files..."
    python manage.py collectstatic --noinput --clear
else
    echo "Skipping collectstatic (RUN_COLLECTSTATIC=${RUN_COLLECTSTATIC})."
fi

echo "Startup complete. Starting server..."
exec "$@"
