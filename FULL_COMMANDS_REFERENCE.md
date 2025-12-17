# Ovii - Full Commands Reference

This document provides a comprehensive reference of all available commands for managing the Ovii platform.

## Table of Contents

1. [Docker & Container Management](#docker--container-management)
2. [Django Management Commands](#django-management-commands)
3. [Database Operations](#database-operations)
4. [WhatsApp Integration](#whatsapp-integration)
5. [Static Files & Media](#static-files--media)
6. [Testing & Development](#testing--development)
7. [Monitoring & Logs](#monitoring--logs)
8. [Production Deployment](#production-deployment)
9. [Troubleshooting](#troubleshooting)

---

## Docker & Container Management

### Starting Services

```bash
# Start all services
docker compose up -d

# Start specific service
docker compose up -d backend
docker compose up -d frontend
docker compose up -d db

# Start with build (rebuild images)
docker compose up -d --build

# View startup logs
docker compose up
```

### Stopping Services

```bash
# Stop all services
docker compose down

# Stop and remove volumes (CAUTION: deletes data)
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
docker compose restart celery_worker
docker compose restart celery_beat
```

### Container Status

```bash
# View running containers
docker compose ps

# View all containers (including stopped)
docker compose ps -a

# View resource usage
docker stats
```

### Accessing Containers

```bash
# Execute command in backend container
docker compose exec backend <command>

# Open bash shell in backend
docker compose exec backend bash

# Open Python shell
docker compose exec backend python manage.py shell

# Open PostgreSQL shell
docker compose exec db psql -U ovii_prod_user -d ovii_prod_db
```

---

## Django Management Commands

### Database Migrations

```bash
# Create new migrations
docker compose exec backend python manage.py makemigrations

# Apply migrations
docker compose exec backend python manage.py migrate

# Show migration status
docker compose exec backend python manage.py showmigrations

# Rollback migration
docker compose exec backend python manage.py migrate <app_name> <migration_number>

# Show SQL for migration
docker compose exec backend python manage.py sqlmigrate <app_name> <migration_number>
```

### User Management

```bash
# Create superuser
docker compose exec backend python manage.py createsuperuser

# Change user password
docker compose exec backend python manage.py changepassword <username>

# List all users
docker compose exec backend python manage.py shell -c "from users.models import OviiUser; print(list(OviiUser.objects.values_list('phone_number', 'email')))"
```

### Application Management

```bash
# Check for issues
docker compose exec backend python manage.py check

# Run system checks
docker compose exec backend python manage.py check --deploy

# Collect static files
docker compose exec backend python manage.py collectstatic --noinput

# Clear cache
docker compose exec backend python manage.py shell -c "from django.core.cache import cache; cache.clear()"
```

---

## Database Operations

### PostgreSQL Commands

```bash
# Connect to PostgreSQL
docker compose exec db psql -U ovii_prod_user -d ovii_prod_db

# Backup database
docker compose exec db pg_dump -U ovii_prod_user ovii_prod_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
docker compose exec -T db psql -U ovii_prod_user ovii_prod_db < backup_file.sql

# List databases
docker compose exec db psql -U ovii_prod_user -c "\l"

# List tables in database
docker compose exec db psql -U ovii_prod_user -d ovii_prod_db -c "\dt"

# Show table structure
docker compose exec db psql -U ovii_prod_user -d ovii_prod_db -c "\d <table_name>"
```

### Database Queries

```bash
# Count users
docker compose exec db psql -U ovii_prod_user -d ovii_prod_db -c "SELECT COUNT(*) FROM users_oviiuser;"

# Count transactions
docker compose exec db psql -U ovii_prod_user -d ovii_prod_db -c "SELECT COUNT(*) FROM wallets_transaction;"

# View recent transactions
docker compose exec db psql -U ovii_prod_user -d ovii_prod_db -c "SELECT * FROM wallets_transaction ORDER BY created_at DESC LIMIT 10;"
```

---

## WhatsApp Integration

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
```

### Webhook Setup

**Webhook URL Format:**
```
https://your-domain.com/api/integrations/webhooks/whatsapp/
```

**Example for api.ovii.it.com:**
```
https://api.ovii.it.com/api/integrations/webhooks/whatsapp/
```

**Generate Webhook Verify Token:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Test Webhook Configuration:**
```bash
# Check environment variables
docker compose exec backend env | grep WHATSAPP

# Test WhatsApp client initialization
docker compose exec backend python manage.py shell -c "from integrations.services import WhatsAppClient; client = WhatsAppClient(); print(f'WABA ID: {client.waba_id}')"
```

### WhatsApp Testing

```bash
# Send test message (in Django shell)
docker compose exec backend python manage.py shell

# Then in the shell:
from integrations.services import WhatsAppClient
client = WhatsAppClient()
client.send_text_message("+263777123456", "Test message from Ovii")

# Send template message
from notifications.services import send_whatsapp_template
send_whatsapp_template(
    phone_number="+263777123456",
    template_name="welcome_message",
    variables={"user_name": "John"}
)
```

---

## Static Files & Media

### Collect Static Files

```bash
# Collect static files
docker compose exec backend python manage.py collectstatic --noinput

# Collect with verbose output
docker compose exec backend python manage.py collectstatic --noinput -v 2

# Clear and recollect
docker compose exec backend python manage.py collectstatic --noinput --clear
```

### Check Static File Locations

```bash
# List static files directory
docker compose exec backend ls -la /home/app/web/staticfiles/

# List media files directory
docker compose exec backend ls -la /home/app/web/mediafiles/

# Check static file settings
docker compose exec backend python manage.py shell -c "from django.conf import settings; print(f'STATIC_ROOT: {settings.STATIC_ROOT}'); print(f'STATIC_URL: {settings.STATIC_URL}')"
```

---

## Testing & Development

### Running Tests

```bash
# Run all tests
docker compose exec backend python manage.py test

# Run specific app tests
docker compose exec backend python manage.py test users
docker compose exec backend python manage.py test wallets
docker compose exec backend python manage.py test integrations

# Run specific test class
docker compose exec backend python manage.py test users.tests.TestOviiUser

# Run with coverage
docker compose exec backend coverage run --source='.' manage.py test
docker compose exec backend coverage report
docker compose exec backend coverage html
```

### Code Quality

```bash
# Check Python code style (if flake8 is installed)
docker compose exec backend flake8 .

# Format code (if black is installed)
docker compose exec backend black .

# Check for security issues (if bandit is installed)
docker compose exec backend bandit -r .
```

### Django Shell

```bash
# Open Django shell
docker compose exec backend python manage.py shell

# Run Python script
docker compose exec backend python manage.py shell < script.py

# Execute inline Python
docker compose exec backend python manage.py shell -c "from users.models import OviiUser; print(OviiUser.objects.count())"
```

---

## Monitoring & Logs

### View Logs

```bash
# View all logs (follow mode)
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f celery_worker
docker compose logs -f db

# View last N lines
docker compose logs --tail=100 backend

# View logs since timestamp
docker compose logs --since 2024-12-17T10:00:00 backend

# Filter logs by keyword
docker compose logs -f backend | grep -i error
docker compose logs -f backend | grep -i whatsapp
docker compose logs -f backend | grep -i webhook
```

### Celery Monitoring

```bash
# View Celery worker status
docker compose exec celery_worker celery -A ovii_backend inspect active

# View Celery stats
docker compose exec celery_worker celery -A ovii_backend inspect stats

# View scheduled tasks (Celery Beat)
docker compose exec celery_worker celery -A ovii_backend inspect scheduled

# Purge all tasks
docker compose exec celery_worker celery -A ovii_backend purge
```

### System Health

```bash
# Check disk usage
docker compose exec backend df -h

# Check memory usage
docker compose exec backend free -h

# Check Python package versions
docker compose exec backend pip list

# Check Django version
docker compose exec backend python -c "import django; print(django.VERSION)"
```

---

## Production Deployment

### Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/morebnyemba/ovii.git
cd ovii

# 2. Configure environment variables
cp .env.example .env
# Edit .env with your production values

# 3. Build and start services
docker compose up -d --build

# 4. Run migrations
docker compose exec backend python manage.py migrate

# 5. Create superuser
docker compose exec backend python manage.py createsuperuser

# 6. Collect static files
docker compose exec backend python manage.py collectstatic --noinput

# 7. Sync WhatsApp templates
docker compose exec backend python manage.py sync_whatsapp_templates
```

### Updates & Maintenance

```bash
# 1. Pull latest changes
git pull origin main

# 2. Rebuild and restart services
docker compose up -d --build

# 3. Run migrations
docker compose exec backend python manage.py migrate

# 4. Collect static files
docker compose exec backend python manage.py collectstatic --noinput

# 5. Restart services
docker compose restart backend celery_worker celery_beat
```

### Backup & Restore

```bash
# Backup database
docker compose exec db pg_dump -U ovii_prod_user ovii_prod_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup media files
docker compose exec backend tar -czf media_backup_$(date +%Y%m%d_%H%M%S).tar.gz /home/app/web/mediafiles/

# Restore database
docker compose exec -T db psql -U ovii_prod_user ovii_prod_db < backup_file.sql

# Restore media files
docker compose exec backend tar -xzf media_backup.tar.gz -C /
```

---

## Troubleshooting

### Common Issues

#### 1. Static Files Warning

```bash
# Check STATICFILES_DIRS setting
docker compose exec backend python manage.py shell -c "from django.conf import settings; print(settings.STATICFILES_DIRS)"

# Solution: Don't set STATICFILES_DIRS environment variable unless needed
# The default configuration works for production
```

#### 2. Environment Variables Not Loading

```bash
# Check if .env file exists
ls -la .env

# View environment variables in container
docker compose exec backend env

# Restart containers to reload environment
docker compose restart backend
```

#### 3. Database Connection Issues

```bash
# Check if database is running
docker compose ps db

# Check database logs
docker compose logs db

# Test database connection
docker compose exec backend python manage.py dbshell
```

#### 4. WhatsApp Template Sync Failures

```bash
# Check WhatsApp credentials
docker compose exec backend python manage.py shell -c "from integrations.services import WhatsAppClient; client = WhatsAppClient(); print(f'Token: {client.access_token[:20]}...'); print(f'WABA ID: {client.waba_id}')"

# View detailed error logs
docker compose logs -f backend | grep -i whatsapp

# Try syncing one template at a time
docker compose exec backend python manage.py sync_whatsapp_templates --template=welcome_message
```

#### 5. Celery Not Processing Tasks

```bash
# Check Celery worker status
docker compose ps celery_worker

# View Celery logs
docker compose logs -f celery_worker

# Restart Celery worker
docker compose restart celery_worker

# Check active tasks
docker compose exec celery_worker celery -A ovii_backend inspect active
```

### Emergency Procedures

#### Reset Database (CAUTION: DELETES ALL DATA)

```bash
# Stop all services
docker compose down

# Remove database volume
docker volume rm ovii_postgres_data

# Start services and migrate
docker compose up -d
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

#### Clear All Redis Cache

```bash
# Connect to Redis
docker compose exec redis redis-cli

# In Redis shell:
FLUSHALL
```

#### Force Rebuild Everything

```bash
# Stop and remove everything
docker compose down -v

# Remove all images
docker compose rm -f
docker rmi $(docker images 'ovii*' -q)

# Rebuild and start
docker compose up -d --build
```

---

## Quick Reference

### Most Used Commands

```bash
# View logs
docker compose logs -f backend

# Run migrations
docker compose exec backend python manage.py migrate

# Restart backend
docker compose restart backend

# Sync WhatsApp templates
docker compose exec backend python manage.py sync_whatsapp_templates

# Open Django shell
docker compose exec backend python manage.py shell

# Check status
docker compose ps
```

### WhatsApp Template Variables (Updated Format)

When sending WhatsApp templates, use combined currency values:

**OLD FORMAT (Don't use - causes 400 errors):**
```python
variables = {
    "amount": "10.00",
    "currency": "USD",  # Duplicate!
    "new_balance": "110.00",
    "currency": "USD",  # Duplicate!
}
```

**NEW FORMAT (Use this):**
```python
variables = {
    "amount_with_currency": "10.00 USD",
    "new_balance_with_currency": "110.00 USD",
    "sender_name": "John Doe",
    "transaction_id": "TXN123456",
}
```

### Webhook URLs

- **Development**: `http://localhost:8000/api/integrations/webhooks/whatsapp/`
- **Production**: `https://api.ovii.it.com/api/integrations/webhooks/whatsapp/`

---

## Additional Resources

- [Deployment Guide](./DEPLOYMENT_COMMANDS.md)
- [WhatsApp Integration](./WHATSAPP_INTEGRATION.md)
- [Webhook Setup Guide](./WEBHOOK_SETUP_GUIDE.md)
- [Quick Start Guide](./QUICK_START.md)
- [README](./README.md)

---

## Support

For issues or questions:
- Check application logs: `docker compose logs -f backend`
- Review documentation in the repository
- Contact: support@ovii.it.com

---

**Last Updated**: December 17, 2024
**Version**: 1.0.0
