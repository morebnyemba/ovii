# Ovii Deployment Commands Reference

This document provides a comprehensive list of commands for managing the Ovii application in production and development environments.

## Table of Contents

1. [Docker Commands](#docker-commands)
2. [Django Management Commands](#django-management-commands)
3. [Database Operations](#database-operations)
4. [Static Files Management](#static-files-management)
5. [WhatsApp Integration Commands](#whatsapp-integration-commands)
6. [Celery Commands](#celery-commands)
7. [Troubleshooting Commands](#troubleshooting-commands)
8. [Webhook Configuration](#webhook-configuration)

---

## Docker Commands

### Starting Services

```bash
# Start all services in detached mode
docker compose up -d

# Start specific service
docker compose up -d backend
docker compose up -d frontend

# Start with build (rebuild images)
docker compose up -d --build

# View logs
docker compose logs -f backend
docker compose logs -f celery_worker
docker compose logs -f celery_beat
```

### Stopping Services

```bash
# Stop all services
docker compose down

# Stop and remove volumes (WARNING: deletes data)
docker compose down -v

# Stop specific service
docker compose stop backend
```

### Service Management

```bash
# Restart a service
docker compose restart backend

# View running containers
docker compose ps

# View resource usage
docker stats
```

### Executing Commands in Containers

```bash
# Execute Django management commands
docker compose exec backend python manage.py <command>

# Open a shell in the backend container
docker compose exec backend bash

# Open Django shell
docker compose exec backend python manage.py shell

# Open database shell
docker compose exec db psql -U $DATABASE_USER -d $DATABASE_NAME
```

---

## Django Management Commands

### All Available Management Commands

```bash
# List all available management commands
docker compose exec backend python manage.py help

# Get help for a specific command
docker compose exec backend python manage.py help <command_name>
```

### User Management

```bash
# Create a superuser
docker compose exec backend python manage.py createsuperuser

# Change user password
docker compose exec backend python manage.py changepassword <username>
```

### Database Operations

```bash
# Make migrations
docker compose exec backend python manage.py makemigrations

# Apply migrations
docker compose exec backend python manage.py migrate

# Show migrations status
docker compose exec backend python manage.py showmigrations

# Rollback migrations
docker compose exec backend python manage.py migrate <app_name> <migration_name>

# Reset migrations (use with caution)
docker compose exec backend python manage.py migrate <app_name> zero
```

### Data Management

```bash
# Load initial data
docker compose exec backend python manage.py loaddata <fixture_name>

# Dump data to fixture
docker compose exec backend python manage.py dumpdata <app_name> > fixture.json

# Flush database (delete all data)
docker compose exec backend python manage.py flush
```

### Testing

```bash
# Run all tests
docker compose exec backend python manage.py test

# Run specific app tests
docker compose exec backend python manage.py test users
docker compose exec backend python manage.py test wallets
docker compose exec backend python manage.py test integrations

# Run specific test class
docker compose exec backend python manage.py test integrations.tests.WhatsAppClientTestCase

# Run with coverage
docker compose exec backend coverage run --source='.' manage.py test
docker compose exec backend coverage report
docker compose exec backend coverage html
```

### System Checks

```bash
# Run Django system checks
docker compose exec backend python manage.py check

# Check specific tags
docker compose exec backend python manage.py check --tag security
docker compose exec backend python manage.py check --deploy
```

---

## Static Files Management

### Collecting Static Files

```bash
# Collect static files
docker compose exec backend python manage.py collectstatic --noinput

# Clear and recollect static files
docker compose exec backend python manage.py collectstatic --noinput --clear
```

### Verifying Static Files Setup

```bash
# Check if static directory exists
docker compose exec backend ls -la /home/app/web/static

# Check if staticfiles directory exists
docker compose exec backend ls -la /home/app/web/staticfiles

# Verify static files in admin
# Navigate to: http://your-domain.com/admin/ and check if CSS loads correctly
```

---

## WhatsApp Integration Commands

### Template Management

```bash
# Display all templates (without syncing)
docker compose exec backend python manage.py sync_whatsapp_templates --display-only

# Display templates in JSON format
docker compose exec backend python manage.py sync_whatsapp_templates --display-only --format=json

# Sync all templates to Meta
docker compose exec backend python manage.py sync_whatsapp_templates

# Sync specific template
docker compose exec backend python manage.py sync_whatsapp_templates --template=otp_verification

# Check template approval status
docker compose exec backend python manage.py sync_whatsapp_templates --check-status

# Check specific template status
docker compose exec backend python manage.py sync_whatsapp_templates --check-status --template=welcome_message
```

### WhatsApp Configuration

```bash
# View WhatsApp configuration
docker compose exec backend python manage.py shell
>>> from integrations.models import WhatsAppConfig
>>> config = WhatsAppConfig.objects.filter(is_active=True).first()
>>> print(f"WABA ID: {config.waba_id}")
>>> print(f"Phone Number ID: {config.phone_number_id}")
>>> print(f"API Version: {config.api_version}")
```

### Testing WhatsApp Messages

```bash
# Test sending a template message
docker compose exec backend python manage.py shell
>>> from notifications.services import send_whatsapp_template
>>> response = send_whatsapp_template(
...     phone_number="+263777123456",
...     template_name="welcome_message",
...     variables={"name": "John"}
... )
>>> print(response)
```

---

## Celery Commands

### Worker Management

```bash
# Start Celery worker (if not using docker-compose)
celery -A ovii_backend worker -l info

# Start with autoreload (development)
celery -A ovii_backend worker -l info --autoreload

# Start on Windows (uses solo pool)
celery -A ovii_backend worker -l info -P solo

# View active tasks
docker compose exec celery_worker celery -A ovii_backend inspect active

# View registered tasks
docker compose exec celery_worker celery -A ovii_backend inspect registered

# Purge all tasks
docker compose exec celery_worker celery -A ovii_backend purge
```

### Beat Scheduler Management

```bash
# View scheduled tasks
docker compose exec backend python manage.py shell
>>> from django_celery_beat.models import PeriodicTask
>>> for task in PeriodicTask.objects.all():
...     print(f"{task.name}: {task.enabled}")

# Create periodic task programmatically
>>> from django_celery_beat.models import PeriodicTask, IntervalSchedule
>>> schedule, created = IntervalSchedule.objects.get_or_create(
...     every=60,
...     period=IntervalSchedule.MINUTES,
... )
>>> PeriodicTask.objects.create(
...     interval=schedule,
...     name='Check pending transactions',
...     task='wallets.tasks.check_pending_transactions',
... )
```

---

## Database Operations

### PostgreSQL Database Commands

```bash
# Connect to database
docker compose exec db psql -U $DATABASE_USER -d $DATABASE_NAME

# Backup database
docker compose exec db pg_dump -U $DATABASE_USER $DATABASE_NAME > backup.sql

# Restore database
cat backup.sql | docker compose exec -T db psql -U $DATABASE_USER -d $DATABASE_NAME

# Check database size
docker compose exec db psql -U $DATABASE_USER -d $DATABASE_NAME -c "SELECT pg_size_pretty(pg_database_size('$DATABASE_NAME'));"

# List all tables
docker compose exec db psql -U $DATABASE_USER -d $DATABASE_NAME -c "\dt"

# List all users
docker compose exec db psql -U $DATABASE_USER -d $DATABASE_NAME -c "SELECT * FROM users_oviiuser LIMIT 10;"
```

### Redis Commands

```bash
# Connect to Redis CLI
docker compose exec redis redis-cli

# Check Redis info
docker compose exec redis redis-cli INFO

# Monitor Redis commands
docker compose exec redis redis-cli MONITOR

# Flush all Redis data (use with caution)
docker compose exec redis redis-cli FLUSHALL

# Check specific keys
docker compose exec redis redis-cli KEYS "*celery*"
```

---

## Troubleshooting Commands

### Viewing Logs

```bash
# View all logs
docker compose logs

# Follow logs in real-time
docker compose logs -f

# View specific service logs
docker compose logs backend
docker compose logs celery_worker
docker compose logs db

# View last 100 lines
docker compose logs --tail=100 backend

# View logs with timestamps
docker compose logs -t backend
```

### Debugging Django

```bash
# Run Django in debug mode
docker compose exec backend python manage.py runserver 0.0.0.0:8000 --noreload

# Check Django configuration
docker compose exec backend python manage.py diffsettings

# Show URLs
docker compose exec backend python manage.py show_urls
```

### Container Health Checks

```bash
# Check container health
docker compose ps

# Inspect container
docker inspect <container_id>

# View container resource usage
docker stats <container_id>

# Check network connectivity
docker compose exec backend ping db
docker compose exec backend ping redis
```

### Fixing Common Issues

```bash
# Fix staticfiles warning
docker compose exec backend mkdir -p /home/app/web/static
docker compose exec backend python manage.py collectstatic --noinput

# Fix permission issues
docker compose exec backend chown -R app:app /home/app/web

# Reset migrations (use with extreme caution)
docker compose exec backend find . -path "*/migrations/*.py" -not -name "__init__.py" -delete
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate

# Rebuild containers
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## Webhook Configuration

### WhatsApp Webhook Setup

The WhatsApp webhook is available at: `https://your-domain.com/api/integrations/webhooks/whatsapp/`

#### Step 1: Configure Verify Token

Choose one of these methods:

**Option A: Environment Variable**
```bash
# Add to .env file
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_secure_random_token_here
```

**Option B: Django Admin**
1. Go to: `https://your-domain.com/admin/`
2. Navigate to: **Integrations > WhatsApp Configurations**
3. Edit the active configuration
4. Set **Webhook Verify Token**: `your_secure_random_token_here`
5. Save

#### Step 2: Configure Webhook in Meta Business Manager

1. Go to: https://developers.facebook.com/apps/
2. Select your app
3. Navigate to **WhatsApp > Configuration**
4. Click **Edit** next to Webhook
5. Configure:
   - **Callback URL**: `https://your-domain.com/api/integrations/webhooks/whatsapp/`
   - **Verify Token**: Same token from Step 1
6. Click **Verify and Save**
7. Subscribe to webhook fields:
   - ✅ `messages` (recommended)
   - ✅ `message_status` (recommended)
   - ☐ `messaging_handovers` (optional)

#### Step 3: Verify Webhook

```bash
# Check webhook logs
docker compose logs -f backend | grep -i whatsapp

# Test webhook manually (from Meta console)
# Meta provides a "Test" button to send a test event

# Verify webhook URL is accessible
curl https://your-domain.com/api/integrations/webhooks/whatsapp/
```

#### Step 4: Test Webhook Integration

```bash
# Send a test message and check if webhook receives it
docker compose logs -f backend

# You should see logs like:
# "WhatsApp webhook received: {...}"
# "Incoming WhatsApp message from +263777123456: Type=text, ID=..."
```

### Paynow Webhook Setup

The Paynow webhook is available at: `https://your-domain.com/api/integrations/webhooks/paynow/`

#### Configuration

```bash
# Add to .env file
PAYNOW_RESULT_URL=https://your-domain.com/api/integrations/webhooks/paynow/
PAYNOW_RETURN_URL=https://your-domain.com/payment/success/
```

---

## Production Deployment Checklist

### Before Deployment

```bash
# 1. Update environment variables
cp .env.example .env
nano .env  # Edit with production values

# 2. Generate new Django secret key
docker compose exec backend python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# 3. Set DEBUG=False
# In .env: DJANGO_DEBUG=False

# 4. Update ALLOWED_HOSTS
# In .env: ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# 5. Configure CORS and CSRF
# In .env:
# CORS_ALLOWED_ORIGINS=https://yourdomain.com
# CSRF_TRUSTED_ORIGINS=https://yourdomain.com,https://api.yourdomain.com

# 6. Run security checks
docker compose exec backend python manage.py check --deploy

# 7. Collect static files
docker compose exec backend python manage.py collectstatic --noinput

# 8. Apply migrations
docker compose exec backend python manage.py migrate

# 9. Create superuser
docker compose exec backend python manage.py createsuperuser
```

### After Deployment

```bash
# 1. Verify services are running
docker compose ps

# 2. Check logs for errors
docker compose logs

# 3. Test admin panel
# https://yourdomain.com/admin/

# 4. Test API documentation
# https://yourdomain.com/api/docs/

# 5. Configure WhatsApp webhook
# Follow WhatsApp Webhook Setup section above

# 6. Sync WhatsApp templates
docker compose exec backend python manage.py sync_whatsapp_templates

# 7. Monitor logs
docker compose logs -f
```

---

## Quick Reference

### Most Common Commands

```bash
# Restart backend after code changes
docker compose restart backend

# View backend logs
docker compose logs -f backend

# Run migrations
docker compose exec backend python manage.py migrate

# Collect static files
docker compose exec backend python manage.py collectstatic --noinput

# Sync WhatsApp templates
docker compose exec backend python manage.py sync_whatsapp_templates

# Check template status
docker compose exec backend python manage.py sync_whatsapp_templates --check-status

# Open Django shell
docker compose exec backend python manage.py shell

# Run tests
docker compose exec backend python manage.py test
```

### Environment Variable Reference

Key environment variables to configure:

```bash
# Django Core
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=your-secret-key
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DATABASE_NAME=ovii_prod_db
DATABASE_USER=ovii_prod_user
DATABASE_PASSWORD=secure_password
DATABASE_HOST=db
DATABASE_PORT=5432

# WhatsApp (configure via admin or .env)
WHATSAPP_WABA_ID=your_waba_id
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_API_VERSION=v18.0
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_verify_token

# Paynow
PAYNOW_INTEGRATION_ID=your_integration_id
PAYNOW_INTEGRATION_KEY=your_integration_key
PAYNOW_RESULT_URL=https://yourdomain.com/api/integrations/webhooks/paynow/
PAYNOW_RETURN_URL=https://yourdomain.com/payment/success/

# Redis
REDIS_HOST=redis
```

---

## Support

For issues or questions:
- Check logs: `docker compose logs -f backend`
- Run health checks: `docker compose exec backend python manage.py check`
- View documentation: [WHATSAPP_INTEGRATION.md](./WHATSAPP_INTEGRATION.md)
- Contact: support@ovii.it.com

---

**Copyright © 2025 Moreblessing Nyemba & Ovii. All Rights Reserved.**
