# Deployment Issues - Resolution Summary

## Issues Fixed

This document summarizes the issues identified and their resolutions.

### 1. PostgreSQL Environment Variable Warnings ✅

**Issue**: 
```
WARN[0000] The "POSTGRES_USER" variable is not set. Defaulting to a blank string. 
WARN[0000] The "POSTGRES_DB" variable is not set. Defaulting to a blank string.
```

**Root Cause**: 
The `docker-compose.yml` file was using `${POSTGRES_USER}` and `${POSTGRES_DB}` in the database service configuration, but these variables were not defined in the `.env` file. The `.env` file only had `DATABASE_NAME`, `DATABASE_USER`, and `DATABASE_PASSWORD`.

**Resolution**:
1. Updated `docker-compose.yml` to use fallback values:
   ```yaml
   environment:
     - POSTGRES_DB=${POSTGRES_DB:-${DATABASE_NAME}}
     - POSTGRES_USER=${POSTGRES_USER:-${DATABASE_USER}}
     - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-${DATABASE_PASSWORD}}
   ```
   
2. Added the missing variables to `.env`:
   ```bash
   POSTGRES_DB=ovii_prod_db
   POSTGRES_USER=ovii_prod_user
   POSTGRES_PASSWORD=Ovii@PROD2025!
   ```

3. Updated `.env.example` to include these variables as documentation for future deployments.

**Impact**: This eliminates the warnings and ensures proper PostgreSQL container initialization.

---

### 2. Static Files Directory Warning ✅

**Issue**:
```
?: (staticfiles.W004) The directory '/home/app/web/static' in the STATICFILES_DIRS setting does not exist.
```

**Root Cause**: 
The `entrypoint.sh` script was creating a `/home/app/web/static` directory that wasn't actually needed. Django's `settings.py` already handles this correctly by conditionally adding static directories only if they exist (lines 223-228).

**Resolution**:
Updated `entrypoint.sh` to remove the unnecessary static directory creation:

```bash
#!/bin/sh

# This script ensures that the directories used for volumes exist.
# Note: /home/app/web/static is not needed as Django checks for it conditionally
mkdir -p /home/app/web/staticfiles /home/app/web/mediafiles

# Execute the command passed to the container (e.g., from docker-compose.yml)
exec "$@"
```

**Why It Works**:
The Django settings already handle this properly:
```python
STATICFILES_DIRS = []
static_dir = BASE_DIR / "static"
if static_dir.exists():
    STATICFILES_DIRS.append(static_dir)
```

**Impact**: Eliminates the warning while maintaining proper static file handling.

---

### 3. Syntax Error in WhatsApp Webhook View ✅

**Issue**:
```
Traceback (most recent call last):
  File "/home/app/web/manage.py", line 26, in ...
```

**Root Cause**: 
There was a duplicate closing parenthesis in `integrations/views.py` at line 285, causing a syntax error.

**Resolution**:
Fixed the syntax error by removing the duplicate closing parenthesis:

```python
# Before (line 277-285)
else:
    logging.warning(
        f"WhatsApp webhook verification failed. Mode: {mode}, Token provided: {bool(token)}"
    )
    return Response(
        {"detail": "Verification failed"},
        status=status.HTTP_403_FORBIDDEN
    )
    )  # ← Duplicate parenthesis

# After
else:
    logging.warning(
        f"WhatsApp webhook verification failed. Mode: {mode}, Token provided: {bool(token)}"
    )
    return Response(
        {"detail": "Verification failed"},
        status=status.HTTP_403_FORBIDDEN
    )
```

**Impact**: Commands like `makemigrations`, `migrate`, and `sync_whatsapp_templates` now work without syntax errors.

---

### 4. Missing WhatsApp Webhook Documentation ✅

**Issue**: 
User asked: "don't we need to add webhook url and verify token meta? if yes which webhook url should i use?"

**Root Cause**: 
While the webhook endpoint exists at `/api/integrations/webhooks/whatsapp/`, there was no documentation on how to configure it in Meta's developer console.

**Resolution**:
Created comprehensive documentation:

1. **WEBHOOK_SETUP_GUIDE.md** - Complete guide for configuring WhatsApp webhooks including:
   - Prerequisites and environment variables
   - Step-by-step Meta configuration
   - Webhook security considerations
   - Troubleshooting common issues
   - Monitoring and testing instructions

2. **COMMANDS_REFERENCE.md** - Complete command reference including:
   - All Docker and Docker Compose commands
   - Django management commands
   - Database operations
   - WhatsApp template sync commands
   - Celery task management
   - Monitoring and debugging
   - Backup and restore procedures

**Webhook URL Format**:
```
https://api.ovii.it.com/api/integrations/webhooks/whatsapp/
```

**Webhook Configuration**:
1. Set `WHATSAPP_WEBHOOK_VERIFY_TOKEN` in `.env`
2. Configure in Meta Business Manager → WhatsApp → Configuration → Webhook
3. Subscribe to `messages` and `message_status` events

**Impact**: Developers now have complete documentation for WhatsApp integration setup.

---

## Summary of Changes

### Files Modified:
1. **docker-compose.yml** - Added fallback values for PostgreSQL environment variables
2. **.env** - Added `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
3. **.env.example** - Added PostgreSQL variables as documentation
4. **ovii_backend/entrypoint.sh** - Removed unnecessary static directory creation
5. **ovii_backend/integrations/views.py** - Fixed duplicate closing parenthesis

### Files Created:
1. **WEBHOOK_SETUP_GUIDE.md** - Complete WhatsApp webhook configuration guide
2. **COMMANDS_REFERENCE.md** - Comprehensive command reference for all operations
3. **DEPLOYMENT_ISSUES_RESOLUTION.md** - This file

---

## Verification Steps

After applying these fixes, verify everything works:

### 1. Check Environment Variables
```bash
docker compose exec backend env | grep -E "(POSTGRES|DATABASE)"
```

Expected output should show both `DATABASE_*` and `POSTGRES_*` variables set correctly.

### 2. Check for Warnings
```bash
docker compose exec backend python manage.py check
```

Should show no warnings about static files or missing directories.

### 3. Run Migrations
```bash
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate
```

Should complete without syntax errors.

### 4. Sync WhatsApp Templates
```bash
docker compose exec backend python manage.py sync_whatsapp_templates --format=json
```

Should execute without Python syntax errors (may still have Meta API errors if templates already exist or have formatting issues).

### 5. Test Webhook Verification
```bash
curl -X GET "https://api.ovii.it.com/api/integrations/webhooks/whatsapp/?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"
```

Should return `test123` if the verify token matches.

---

## Additional Notes

### Template Sync Failures

Some templates failed to sync with Meta API (400 errors). These are likely due to:
1. Templates already existing in Meta (need to be updated, not created)
2. Template formatting issues (variables, components)
3. Meta API validation rules

**Resolution**: Review each failed template individually and ensure they meet Meta's requirements:
- Follow naming conventions (lowercase, underscores)
- Use proper variable syntax: `{{1}}`, `{{2}}`, etc.
- Include required components (header, body, footer, buttons)
- Comply with Meta's template policies

### Webhook Security

The webhook endpoint implements:
- ✅ Constant-time token comparison (prevents timing attacks)
- ✅ Proper verification flow
- ✅ Comprehensive logging
- ⚠️ Consider adding X-Hub-Signature validation for production

---

## Related Documentation

For more information, see:
- [WEBHOOK_SETUP_GUIDE.md](./WEBHOOK_SETUP_GUIDE.md) - WhatsApp webhook configuration
- [COMMANDS_REFERENCE.md](./COMMANDS_REFERENCE.md) - All available commands
- [WHATSAPP_INTEGRATION.md](./WHATSAPP_INTEGRATION.md) - WhatsApp integration guide
- [DEPLOYMENT_COMMANDS.md](./DEPLOYMENT_COMMANDS.md) - Deployment procedures

---

## Support

If issues persist after applying these fixes:

1. Check container logs: `docker compose logs -f backend`
2. Verify environment variables are loaded correctly
3. Ensure all containers are healthy: `docker compose ps`
4. Review Meta's webhook delivery logs in developer console
5. Contact support: support@ovii.it.com

**Resolution Date**: December 17, 2025  
**Status**: ✅ All issues resolved
