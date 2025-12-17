# Fixes Summary - Staticfiles Warning and WhatsApp Configuration

**Date**: December 2025  
**Author**: GitHub Copilot  
**Issue**: Staticfiles warning and WhatsApp webhook configuration questions

---

## Issues Addressed

### 1. Staticfiles Warning (✅ FIXED)

**Problem**:
```
?: (staticfiles.W004) The directory '/home/app/web/static' in the STATICFILES_DIRS setting does not exist.
```

**Root Cause**:
Django settings.py had `STATICFILES_DIRS = [BASE_DIR / "static"]` configured, but this directory doesn't exist in the Docker container by default. While the entrypoint.sh creates `/home/app/web/static`, there's a timing issue where Django checks for the directory before it's created.

**Solution**:
Updated `ovii_backend/ovii_backend/settings.py` to conditionally add the static directory to `STATICFILES_DIRS` only if it exists:

```python
# Only add STATICFILES_DIRS if the static directory exists
# This prevents the warning: "The directory '/path/to/static' in STATICFILES_DIRS does not exist"
STATICFILES_DIRS = []
static_dir = BASE_DIR / "static"
if static_dir.exists():
    STATICFILES_DIRS.append(static_dir)
```

**Result**: The warning will no longer appear during migrations, management commands, or server startup.

---

### 2. WhatsApp Webhook Configuration (✅ DOCUMENTED)

**Question**: "Don't we need to add webhook url and verify token to Meta? If yes, which webhook url should I use?"

**Answer**: YES! WhatsApp webhooks are required for receiving:
- Incoming messages from users
- Message delivery status (sent, delivered, read)
- Message read receipts
- Account updates

#### Webhook URL

Use this URL for your WhatsApp webhook:
```
https://api.ovii.it.com/api/integrations/webhooks/whatsapp/
```

**For your domain**: Replace `api.ovii.it.com` with your actual API domain.

#### Configuration Steps

**Step 1: Set Webhook Verify Token**

Choose one method:

**Option A: Via Django Admin (Recommended)**
1. Navigate to: `https://api.ovii.it.com/admin/`
2. Go to: **Integrations > WhatsApp Configurations**
3. Edit the active configuration
4. Set **Webhook Verify Token** to a secure random string
5. Click **Save**

**Option B: Via Environment Variables**

Add to your `.env` file:
```bash
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_secure_random_token_here
```

💡 **Tip**: Generate a secure token:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Step 2: Configure in Meta Business Manager**

1. Go to: https://developers.facebook.com/apps/
2. Select your WhatsApp Business app
3. Navigate to: **WhatsApp > Configuration**
4. Click **Edit** next to Webhook
5. Configure:
   - **Callback URL**: `https://api.ovii.it.com/api/integrations/webhooks/whatsapp/`
   - **Verify Token**: Same token from Step 1
6. Click **Verify and Save**
7. Subscribe to webhook fields:
   - ✅ `messages` (recommended)
   - ✅ `message_status` (recommended)

**Step 3: Test Webhook**

```bash
# View webhook logs
docker compose logs -f backend | grep -i whatsapp

# Test webhook verification (GET request)
curl "https://api.ovii.it.com/api/integrations/webhooks/whatsapp/?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=123456789"
# Should return: 123456789

# Test webhook notification (POST request)
curl -X POST https://api.ovii.it.com/api/integrations/webhooks/whatsapp/ \
  -H "Content-Type: application/json" \
  -d '{"entry": [{"changes": [{"value": {"messages": []}}]}]}'
# Should return: {"status": "received"}
```

---

## 3. All Available Commands (✅ DOCUMENTED)

Here's a comprehensive list of all commands you can use:

### Docker Commands

```bash
# Start all services
docker compose up -d

# Start with rebuild
docker compose up -d --build

# Stop all services
docker compose down

# Restart a service
docker compose restart backend

# View logs
docker compose logs -f backend
docker compose logs -f celery_worker
docker compose logs -f celery_beat

# View running containers
docker compose ps

# Execute commands in containers
docker compose exec backend python manage.py <command>
docker compose exec backend bash
```

### Django Management Commands

```bash
# List all available commands
docker compose exec backend python manage.py help

# Database operations
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py showmigrations

# User management
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py changepassword <username>

# Static files
docker compose exec backend python manage.py collectstatic --noinput

# Django shell
docker compose exec backend python manage.py shell

# Tests
docker compose exec backend python manage.py test
docker compose exec backend python manage.py test integrations.tests
```

### WhatsApp Template Commands

```bash
# Sync all templates to Meta
docker compose exec backend python manage.py sync_whatsapp_templates

# Sync specific template
docker compose exec backend python manage.py sync_whatsapp_templates --template=otp_verification

# Check approval status
docker compose exec backend python manage.py sync_whatsapp_templates --check-status

# Display templates without syncing (text format)
docker compose exec backend python manage.py sync_whatsapp_templates --display-only

# Display templates in JSON format
docker compose exec backend python manage.py sync_whatsapp_templates --display-only --format=json
```

### Database Commands

```bash
# Connect to PostgreSQL
docker compose exec db psql -U $DATABASE_USER -d $DATABASE_NAME

# Backup database
docker compose exec db pg_dump -U $DATABASE_USER $DATABASE_NAME > backup.sql

# Restore database
cat backup.sql | docker compose exec -T db psql -U $DATABASE_USER -d $DATABASE_NAME

# Check database size
docker compose exec db psql -U $DATABASE_USER -d $DATABASE_NAME -c "SELECT pg_size_pretty(pg_database_size('$DATABASE_NAME'));"
```

### Redis Commands

```bash
# Connect to Redis CLI
docker compose exec redis redis-cli

# Check Redis info
docker compose exec redis redis-cli INFO

# Monitor Redis commands
docker compose exec redis redis-cli MONITOR

# Flush all Redis data (use with caution!)
docker compose exec redis redis-cli FLUSHALL
```

### Celery Commands

```bash
# View active tasks
docker compose exec celery_worker celery -A ovii_backend inspect active

# View registered tasks
docker compose exec celery_worker celery -A ovii_backend inspect registered

# Purge all tasks
docker compose exec celery_worker celery -A ovii_backend purge
```

### Troubleshooting Commands

```bash
# Check Django configuration
docker compose exec backend python manage.py check
docker compose exec backend python manage.py check --deploy

# View Django settings differences
docker compose exec backend python manage.py diffsettings

# Fix staticfiles warning (now handled automatically)
docker compose exec backend mkdir -p /home/app/web/static
docker compose exec backend python manage.py collectstatic --noinput

# View container health
docker compose ps
docker stats

# Check network connectivity
docker compose exec backend ping db
docker compose exec backend ping redis
```

---

## Summary of Changes Made

### Files Modified

1. **`ovii_backend/ovii_backend/settings.py`**
   - Fixed staticfiles warning by conditionally adding static directory to `STATICFILES_DIRS`
   - Only adds the directory if it exists, preventing the warning

2. **`DEPLOYMENT_COMMANDS.md`**
   - Added comprehensive list of all available management commands
   - Clarified Django management command usage

3. **`FIXES_SUMMARY.md`** (this file)
   - Created comprehensive summary document
   - Answered all user questions
   - Provided complete command reference

### Files Already Correct (No Changes Needed)

1. **`ovii_backend/entrypoint.sh`**
   - Already creates required directories
   - No changes needed

2. **`WHATSAPP_INTEGRATION.md`**
   - Already has comprehensive webhook configuration documentation
   - No changes needed

---

## Next Steps

1. ✅ **Staticfiles warning**: Fixed automatically - no action needed
2. ⏩ **Configure webhook in Meta**: Follow steps above to configure webhook URL and verify token
3. ⏩ **Sync templates**: Run `docker compose exec backend python manage.py sync_whatsapp_templates`
4. ⏩ **Check template status**: Run `docker compose exec backend python manage.py sync_whatsapp_templates --check-status`
5. ⏩ **Monitor webhooks**: Run `docker compose logs -f backend | grep -i whatsapp`

---

## Testing the Fixes

### Verify Staticfiles Fix

```bash
# This should now run without the staticfiles warning
docker compose exec backend python manage.py check

# This should also work without warnings
docker compose exec backend python manage.py migrate

# Collect static files
docker compose exec backend python manage.py collectstatic --noinput
```

### Verify Webhook Configuration

```bash
# Check if webhook endpoint is accessible
curl https://api.ovii.it.com/api/integrations/webhooks/whatsapp/

# Test webhook verification
curl "https://api.ovii.it.com/api/integrations/webhooks/whatsapp/?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"

# Should return: test123
```

---

## Additional Resources

- **Full webhook documentation**: [WHATSAPP_INTEGRATION.md](./WHATSAPP_INTEGRATION.md#webhook-configuration)
- **All deployment commands**: [DEPLOYMENT_COMMANDS.md](./DEPLOYMENT_COMMANDS.md)
- **WhatsApp template troubleshooting**: [WHATSAPP_TEMPLATE_TROUBLESHOOTING.md](./WHATSAPP_TEMPLATE_TROUBLESHOOTING.md)

---

**Copyright © 2025 Moreblessing Nyemba & Ovii. All Rights Reserved.**
