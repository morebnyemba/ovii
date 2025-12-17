# WhatsApp Integration Commands Reference

This document provides a comprehensive list of all commands for managing the WhatsApp integration in Ovii.

## Table of Contents
- [Template Management](#template-management)
- [Webhook Configuration](#webhook-configuration)
- [Database Management](#database-management)
- [Docker Commands](#docker-commands)
- [Troubleshooting](#troubleshooting)

---

## Template Management

### Display Templates (Without Syncing)

Display all available WhatsApp templates without syncing them to Meta:

```bash
# Text format (default)
docker compose exec backend python manage.py sync_whatsapp_templates --display-only

# JSON format
docker compose exec backend python manage.py sync_whatsapp_templates --display-only --format=json
```

### Sync Templates to Meta

Sync all templates to Meta Business Manager:

```bash
# Basic sync
docker compose exec backend python manage.py sync_whatsapp_templates

# Verbose mode (shows detailed error information and request/response payloads)
docker compose exec backend python manage.py sync_whatsapp_templates --verbose

# Sync a specific template only
docker compose exec backend python manage.py sync_whatsapp_templates --template=otp_verification

# Sync specific template with verbose output
docker compose exec backend python manage.py sync_whatsapp_templates --template=transaction_received --verbose
```

### Check Template Status

Check the approval status of templates in Meta:

```bash
# Check all templates
docker compose exec backend python manage.py sync_whatsapp_templates --check-status

# Check specific template
docker compose exec backend python manage.py sync_whatsapp_templates --check-status --template=welcome_message
```

---

## Webhook Configuration

### Webhook URL Format

Your webhook URL should follow this format:
```
https://your-domain.com/api/integrations/whatsapp/webhook/
```

**Production Example:**
```
https://api.ovii.it.com/api/integrations/whatsapp/webhook/
```

### Setup Webhook in Meta Developer Console

1. **Navigate to Meta for Developers**
   ```
   URL: https://developers.facebook.com/
   ```

2. **Access Webhook Configuration**
   - Select your app
   - Go to **WhatsApp** → **Configuration**
   - Find the **Webhook** section
   - Click **Edit**

3. **Configure Webhook**
   - **Callback URL**: `https://api.ovii.it.com/api/integrations/whatsapp/webhook/`
   - **Verify Token**: Use the token from `WHATSAPP_WEBHOOK_VERIFY_TOKEN` in your `.env` file
   - Click **Verify and Save**

4. **Subscribe to Webhook Fields**
   - messages
   - message_status
   - messaging_postbacks (optional)

### Generate Webhook Verification Token

```bash
# Generate a secure random token
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Add the generated token to your `.env` file:
```env
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_generated_token_here
```

### Test Webhook

Test your webhook endpoint:

```bash
# Test webhook verification (GET request)
curl "https://api.ovii.it.com/api/integrations/whatsapp/webhook/?hub.mode=subscribe&hub.verify_token=your_token&hub.challenge=test_challenge"

# Expected response: test_challenge
```

---

## Database Management

### Migrations

```bash
# Create migrations
docker compose exec backend python manage.py makemigrations

# Create migrations for specific app
docker compose exec backend python manage.py makemigrations integrations

# Apply migrations
docker compose exec backend python manage.py migrate

# Check migration status
docker compose exec backend python manage.py showmigrations

# Show SQL for a migration
docker compose exec backend python manage.py sqlmigrate integrations 0001
```

### Database Shell

```bash
# Django database shell
docker compose exec backend python manage.py dbshell

# Django Python shell
docker compose exec backend python manage.py shell
```

### Admin User Management

```bash
# Create superuser
docker compose exec backend python manage.py createsuperuser

# Change password for a user
docker compose exec backend python manage.py changepassword username
```

---

## Docker Commands

### Container Management

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Restart specific service
docker compose restart backend

# View logs
docker compose logs -f backend
docker compose logs -f celery_worker

# View logs for specific number of lines
docker compose logs --tail=100 backend
```

### Execute Commands in Container

```bash
# Execute any Django command
docker compose exec backend python manage.py <command>

# Access bash shell in container
docker compose exec backend bash

# Access Python shell
docker compose exec backend python manage.py shell
```

### Database Container

```bash
# Access PostgreSQL shell
docker compose exec db psql -U $POSTGRES_USER -d $POSTGRES_DB

# Backup database
docker compose exec db pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup.sql

# Restore database
docker compose exec -T db psql -U $POSTGRES_USER -d $POSTGRES_DB < backup.sql
```

### Rebuild and Update

```bash
# Rebuild specific service
docker compose build backend

# Rebuild without cache
docker compose build --no-cache backend

# Pull latest images
docker compose pull

# Rebuild and restart
docker compose up -d --build
```

---

## Troubleshooting

### View Detailed Logs

```bash
# View all backend logs
docker compose logs backend

# Follow logs in real-time
docker compose logs -f backend

# View logs with timestamps
docker compose logs -t backend

# View last 100 lines
docker compose logs --tail=100 backend
```

### Check Container Status

```bash
# List all containers
docker compose ps

# Check resource usage
docker stats
```

### Environment Variables

```bash
# Check environment variables in container
docker compose exec backend env | grep WHATSAPP
docker compose exec backend env | grep POSTGRES
```

### Static Files Issues

```bash
# Collect static files
docker compose exec backend python manage.py collectstatic --noinput

# Check static files configuration
docker compose exec backend python manage.py findstatic admin/css/base.css
```

### Clear Cache

```bash
# Clear Redis cache
docker compose exec redis redis-cli FLUSHALL

# Clear Django cache
docker compose exec backend python manage.py shell
>>> from django.core.cache import cache
>>> cache.clear()
```

### Database Connection Issues

```bash
# Test database connection
docker compose exec backend python manage.py dbshell

# Check database status
docker compose exec db pg_isready -U $POSTGRES_USER
```

### Template Sync Troubleshooting

```bash
# Sync with verbose output to see detailed errors
docker compose exec backend python manage.py sync_whatsapp_templates --verbose

# Check specific template with verbose output
docker compose exec backend python manage.py sync_whatsapp_templates --template=otp_verification --verbose

# Display template definition
docker compose exec backend python manage.py sync_whatsapp_templates --display-only --format=json | grep -A 20 "otp_verification"
```

### Common Error Solutions

#### Static Files Warning
```
?: (staticfiles.W004) The directory '/home/app/web/static' in the STATICFILES_DIRS setting does not exist.
```

**Solution**: Remove or comment out `STATICFILES_DIRS` from your `.env` file if you're not using custom static directories.

#### POSTGRES Variable Warnings
```
WARN[0000] The "POSTGRES_USER" variable is not set. Defaulting to a blank string.
```

**Solution**: Add these variables to your `.env` file:
```env
POSTGRES_DB=ovii_db
POSTGRES_USER=ovii_user
POSTGRES_PASSWORD=your_password
```

#### Template Sync 400 Errors

**Solution**: Run sync with verbose flag to see detailed error:
```bash
docker compose exec backend python manage.py sync_whatsapp_templates --verbose
```

Common reasons for 400 errors:
- Template name already exists in Meta
- Invalid template format
- Missing required fields
- Incorrect variable count
- Invalid language code

---

## Quick Reference

### Most Common Commands

```bash
# 1. Sync templates with detailed logging
docker compose exec backend python manage.py sync_whatsapp_templates --verbose

# 2. Check template status
docker compose exec backend python manage.py sync_whatsapp_templates --check-status

# 3. View backend logs
docker compose logs -f backend

# 4. Apply database migrations
docker compose exec backend python manage.py migrate

# 5. Restart backend service
docker compose restart backend

# 6. Access Django shell
docker compose exec backend python manage.py shell

# 7. Access database shell
docker compose exec db psql -U $POSTGRES_USER -d $POSTGRES_DB

# 8. View environment variables
docker compose exec backend env | grep WHATSAPP
```

---

## Additional Resources

- **WhatsApp Business API Documentation**: https://developers.facebook.com/docs/whatsapp/cloud-api
- **Meta Business Manager**: https://business.facebook.com/
- **Django Management Commands**: https://docs.djangoproject.com/en/stable/ref/django-admin/
- **Docker Compose Documentation**: https://docs.docker.com/compose/

---

## Support

For issues or questions:
1. Check the logs with `--verbose` flag
2. Review the error messages in detail
3. Verify environment variables are set correctly
4. Ensure webhook is configured properly in Meta
5. Check Meta Business Manager for template approval status

**Author**: Moreblessing Nyemba  
**Copyright**: © 2025 Moreblessing Nyemba & Ovii. All Rights Reserved.
