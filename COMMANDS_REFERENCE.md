# Ovii Deployment Commands Reference

This guide provides a comprehensive list of all available commands for managing the Ovii platform in production and development environments.

## Table of Contents

1. [Docker & Container Management](#docker--container-management)
2. [Django Management Commands](#django-management-commands)
3. [Database Operations](#database-operations)
4. [WhatsApp Integration](#whatsapp-integration)
5. [Static & Media Files](#static--media-files)
6. [Celery & Background Tasks](#celery--background-tasks)
7. [Monitoring & Debugging](#monitoring--debugging)
8. [Backup & Restore](#backup--restore)

---

## Docker & Container Management

### Starting Services

```bash
# Start all services in detached mode
docker compose up -d

# Start specific service
docker compose up -d backend

# Build and start services (after code changes)
docker compose up -d --build

# Start with production configuration
docker compose -f docker-compose.prod.yml up -d --build
```

### Stopping Services

```bash
# Stop all services
docker compose down

# Stop and remove volumes (⚠️ deletes all data!)
docker compose down -v

# Stop specific service
docker compose stop backend
```

### Restarting Services

```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart backend

# Restart after environment variable changes
docker compose restart backend celery_worker celery_beat
```

### Viewing Logs

```bash
# View all logs (follow mode)
docker compose logs -f

# View logs for specific service
docker compose logs -f backend

# View last 100 lines
docker compose logs --tail=100 backend

# View logs since specific time
docker compose logs --since 30m backend

# Filter logs
docker compose logs -f backend | grep -i error
docker compose logs -f backend | grep -i whatsapp
```

### Container Management

```bash
# List running containers
docker compose ps

# List all containers (including stopped)
docker compose ps -a

# Execute command in container
docker compose exec backend python manage.py shell

# Access container shell
docker compose exec backend /bin/sh
docker compose exec backend bash

# Check container resource usage
docker stats

# Inspect container
docker compose inspect backend
```

---

## Django Management Commands

All Django management commands should be run inside the backend container:

```bash
docker compose exec backend python manage.py <command>
```

### Application Management

```bash
# Create Django superuser
docker compose exec backend python manage.py createsuperuser

# Run development server (for testing only)
docker compose exec backend python manage.py runserver 0.0.0.0:8000

# Django shell
docker compose exec backend python manage.py shell

# Django shell with iPython (if installed)
docker compose exec backend python manage.py shell_plus

# Check Django configuration
docker compose exec backend python manage.py check

# Check with deployment checklist
docker compose exec backend python manage.py check --deploy

# Show installed apps
docker compose exec backend python manage.py showmigrations

# Validate models
docker compose exec backend python manage.py validate
```

### User Management

```bash
# Create superuser
docker compose exec backend python manage.py createsuperuser

# Change user password
docker compose exec backend python manage.py changepassword <username>

# Create test users (if custom command exists)
docker compose exec backend python manage.py create_test_users
```

---

## Database Operations

### Migrations

```bash
# Create new migrations
docker compose exec backend python manage.py makemigrations

# Create migrations for specific app
docker compose exec backend python manage.py makemigrations users

# Apply all migrations
docker compose exec backend python manage.py migrate

# Apply migrations for specific app
docker compose exec backend python manage.py migrate users

# Show migration SQL (dry-run)
docker compose exec backend python manage.py sqlmigrate users 0001

# Show applied migrations
docker compose exec backend python manage.py showmigrations

# Show unapplied migrations
docker compose exec backend python manage.py showmigrations --plan

# Fake migrations (mark as applied without running)
docker compose exec backend python manage.py migrate --fake

# Reverse migration
docker compose exec backend python manage.py migrate users 0001

# Create empty migration
docker compose exec backend python manage.py makemigrations --empty users
```

### Database Shell

```bash
# PostgreSQL shell
docker compose exec db psql -U ovii_prod_user -d ovii_prod_db

# Django database shell
docker compose exec backend python manage.py dbshell
```

### Database Inspection

```bash
# Show database schema
docker compose exec backend python manage.py inspectdb

# Show SQL for creating tables
docker compose exec backend python manage.py sqlall users
```

---

## WhatsApp Integration

### Template Management

```bash
# Sync all templates to Meta
docker compose exec backend python manage.py sync_whatsapp_templates

# Sync templates with JSON output
docker compose exec backend python manage.py sync_whatsapp_templates --format=json

# Check template approval status
docker compose exec backend python manage.py sync_whatsapp_templates --check-status

# Sync specific template
docker compose exec backend python manage.py sync_whatsapp_templates --template=otp_verification

# Dry-run (preview changes without syncing)
docker compose exec backend python manage.py sync_whatsapp_templates --dry-run

# Force sync (recreate all templates)
docker compose exec backend python manage.py sync_whatsapp_templates --force
```

### Testing WhatsApp Integration

```bash
# Test sending WhatsApp template
docker compose exec backend python manage.py shell
>>> from notifications.services import send_whatsapp_template
>>> send_whatsapp_template(
...     phone_number="+263771234567",
...     template_name="welcome_message",
...     variables={"name": "John"}
... )

# Test webhook verification
curl -X GET "https://api.ovii.it.com/api/integrations/webhooks/whatsapp/?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test"
```

---

## Static & Media Files

### Collect Static Files

```bash
# Collect all static files
docker compose exec backend python manage.py collectstatic --noinput

# Collect with clear (remove old files first)
docker compose exec backend python manage.py collectstatic --clear --noinput

# Dry-run (preview without copying)
docker compose exec backend python manage.py collectstatic --dry-run

# Find static files
docker compose exec backend python manage.py findstatic admin/css/base.css
```

### Media Files Management

```bash
# Create media directories
docker compose exec backend mkdir -p /home/app/web/mediafiles

# Check media directory permissions
docker compose exec backend ls -la /home/app/web/mediafiles

# Fix permissions
docker compose exec backend chown -R app:app /home/app/web/mediafiles
```

---

## Celery & Background Tasks

### Celery Worker

```bash
# Start Celery worker (already runs in docker-compose)
docker compose exec backend celery -A ovii_backend worker -l info

# Start worker with specific queues
docker compose exec backend celery -A ovii_backend worker -Q default,emails -l info

# Start worker with concurrency
docker compose exec backend celery -A ovii_backend worker -l info --concurrency=4

# Restart Celery worker
docker compose restart celery_worker

# View Celery worker logs
docker compose logs -f celery_worker
```

### Celery Beat (Scheduled Tasks)

```bash
# View Celery beat logs
docker compose logs -f celery_beat

# Restart Celery beat
docker compose restart celery_beat

# Inspect scheduled tasks
docker compose exec backend python manage.py shell
>>> from django_celery_beat.models import PeriodicTask
>>> PeriodicTask.objects.all()
```

### Task Monitoring

```bash
# Inspect active tasks
docker compose exec backend celery -A ovii_backend inspect active

# Inspect registered tasks
docker compose exec backend celery -A ovii_backend inspect registered

# Inspect scheduled tasks
docker compose exec backend celery -A ovii_backend inspect scheduled

# View task stats
docker compose exec backend celery -A ovii_backend inspect stats

# Purge all tasks
docker compose exec backend celery -A ovii_backend purge
```

---

## Monitoring & Debugging

### Application Health Checks

```bash
# Check application status
curl http://localhost:8000/admin/

# Check database connection
docker compose exec backend python manage.py check --database default

# Check Redis connection
docker compose exec redis redis-cli ping

# Check PostgreSQL connection
docker compose exec db pg_isready -U ovii_prod_user
```

### System Information

```bash
# View environment variables
docker compose exec backend env | grep -E "(DATABASE|REDIS|WHATSAPP)"

# Check Python version
docker compose exec backend python --version

# Check installed packages
docker compose exec backend pip list

# Check Django version
docker compose exec backend python -c "import django; print(django.get_version())"

# Check disk usage
docker system df

# Check container resource usage
docker stats --no-stream
```

### Debugging

```bash
# Django debug mode (development only)
# Set DJANGO_DEBUG=True in .env and restart

# View SQL queries in shell
docker compose exec backend python manage.py shell
>>> from django.db import connection
>>> from django.db import reset_queries
>>> from django.conf import settings
>>> settings.DEBUG = True
# Run your queries
>>> print(connection.queries)

# Test email configuration
docker compose exec backend python manage.py sendtestemail test@example.com

# Clear cache
docker compose exec backend python manage.py shell
>>> from django.core.cache import cache
>>> cache.clear()
```

---

## Backup & Restore

### Database Backup

```bash
# Backup PostgreSQL database
docker compose exec db pg_dump -U ovii_prod_user ovii_prod_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup with compression
docker compose exec db pg_dump -U ovii_prod_user ovii_prod_db | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Backup specific tables
docker compose exec db pg_dump -U ovii_prod_user -t users_oviiuser ovii_prod_db > users_backup.sql
```

### Database Restore

```bash
# Restore from backup
cat backup.sql | docker compose exec -T db psql -U ovii_prod_user ovii_prod_db

# Restore from compressed backup
gunzip -c backup.sql.gz | docker compose exec -T db psql -U ovii_prod_user ovii_prod_db

# Restore with DROP existing database (⚠️ destructive!)
docker compose exec db psql -U ovii_prod_user -c "DROP DATABASE IF EXISTS ovii_prod_db;"
docker compose exec db psql -U ovii_prod_user -c "CREATE DATABASE ovii_prod_db;"
cat backup.sql | docker compose exec -T db psql -U ovii_prod_user ovii_prod_db
```

### Media Files Backup

```bash
# Backup media files
docker compose exec backend tar -czf /tmp/media_backup_$(date +%Y%m%d).tar.gz /home/app/web/mediafiles
docker cp $(docker compose ps -q backend):/tmp/media_backup_*.tar.gz ./backups/

# Restore media files
docker cp ./backups/media_backup.tar.gz $(docker compose ps -q backend):/tmp/
docker compose exec backend tar -xzf /tmp/media_backup.tar.gz -C /
```

---

## Environment-Specific Commands

### Development Environment

```bash
# Run tests
docker compose exec backend python manage.py test

# Run specific test
docker compose exec backend python manage.py test users.tests.test_models

# Run with coverage
docker compose exec backend coverage run manage.py test
docker compose exec backend coverage report

# Create test data
docker compose exec backend python manage.py loaddata fixtures/test_data.json

# Export data as fixture
docker compose exec backend python manage.py dumpdata users --indent 2 > fixtures/users.json
```

### Production Environment

```bash
# Build production images
docker compose -f docker-compose.prod.yml build

# Deploy production
docker compose -f docker-compose.prod.yml up -d

# View production logs
docker compose -f docker-compose.prod.yml logs -f

# Restart production services
docker compose -f docker-compose.prod.yml restart backend
```

---

## Maintenance Commands

### Cleanup

```bash
# Remove unused Docker resources
docker system prune -a

# Remove old images
docker image prune -a

# Remove unused volumes (⚠️ may delete data!)
docker volume prune

# Clean old migrations (be careful!)
docker compose exec backend find . -path "*/migrations/*.py" -not -name "__init__.py" -delete
docker compose exec backend find . -path "*/migrations/*.pyc" -delete
```

### Updates

```bash
# Pull latest code
git pull origin main

# Rebuild containers
docker compose up -d --build

# Apply new migrations
docker compose exec backend python manage.py migrate

# Collect new static files
docker compose exec backend python manage.py collectstatic --noinput

# Restart services
docker compose restart backend celery_worker celery_beat
```

---

## Quick Reference: Common Workflows

### Deploying New Code

```bash
git pull origin main
docker compose build backend
docker compose up -d backend
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py collectstatic --noinput
docker compose restart celery_worker celery_beat
```

### Checking Logs After Deployment

```bash
docker compose logs -f backend | head -100
docker compose logs -f celery_worker | head -50
docker compose ps
```

### Troubleshooting Database Issues

```bash
docker compose logs db
docker compose exec db pg_isready -U ovii_prod_user
docker compose exec backend python manage.py check --database default
docker compose exec backend python manage.py migrate --plan
```

### Resetting Development Environment

```bash
docker compose down -v
docker compose up -d
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py collectstatic --noinput
```

---

## Environment Variables Reference

Key environment variables used in commands:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_NAME` | PostgreSQL database name | `ovii_prod_db` |
| `DATABASE_USER` | PostgreSQL username | `ovii_prod_user` |
| `POSTGRES_DB` | PostgreSQL DB (Docker) | `ovii_prod_db` |
| `POSTGRES_USER` | PostgreSQL user (Docker) | `ovii_prod_user` |
| `REDIS_HOST` | Redis hostname | `redis` |
| `WHATSAPP_WABA_ID` | WhatsApp Business Account ID | `1234567890` |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Webhook verification token | `random_secure_token` |

---

## Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Celery Documentation](https://docs.celeryproject.org/)
- [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## Support

For issues or questions:
- Check logs: `docker compose logs -f backend`
- Review deployment documentation
- Contact: support@ovii.it.com

**Last Updated**: December 2025
