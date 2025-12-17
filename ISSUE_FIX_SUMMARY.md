# Quick Fix Summary - Issue Resolution

## Issues Resolved ✅

### 1. Static Files Warning Fixed
**Problem:**
```
?: (staticfiles.W004) The directory '/home/app/web/static' in the STATICFILES_DIRS setting does not exist.
```

**Solution:**
- Modified `ovii_backend/ovii_backend/settings.py` to only add `STATICFILES_DIRS` when explicitly configured via environment variable
- No longer tries to add `/home/app/web/static` by default
- Warning will no longer appear

### 2. Environment Variable Warnings Fixed
**Problem:**
```
WARN[0000] The "POSTGRES_USER" variable is not set. Defaulting to a blank string.
WARN[0000] The "POSTGRES_DB" variable is not set. Defaulting to a blank string.
```

**Solution:**
- Updated `docker-compose.yml` with proper default values
- Changed from nested variable substitution to direct defaults
- Variables now properly fallback to sensible defaults

**Before:**
```yaml
POSTGRES_DB=${POSTGRES_DB:-${DATABASE_NAME}}
POSTGRES_USER=${POSTGRES_USER:-${DATABASE_USER}}
```

**After:**
```yaml
POSTGRES_DB=${POSTGRES_DB:-ovii_prod_db}
POSTGRES_USER=${POSTGRES_USER:-ovii_prod_user}
```

### 3. WhatsApp Template Sync Failures Fixed
**Problem:**
```
ERROR: Failed to create template 'transaction_received': HTTP None, 400 Client Error: Bad Request
ERROR: Failed to create template 'transaction_sent': HTTP None, 400 Client Error: Bad Request
ERROR: Failed to create template 'deposit_confirmed': HTTP None, 400 Client Error: Bad Request
... (7 templates failing)
```

**Root Cause:**
1. Templates had duplicate "currency" variables which Meta's API rejects
2. The `otp_verification` template (AUTHENTICATION category) had formatting issues

**Solution:**
- Updated 7 templates to combine amount and currency
- Fixed `otp_verification` template formatting for AUTHENTICATION category
- Changed from separate variables to combined format

**Example Fixes:**
```python
# Currency duplicate issue (WRONG - causes 400 error)
variables: ["amount", "currency", "new_balance", "currency"]  # Duplicate!

# Fixed (CORRECT)
variables: ["amount_with_currency", "new_balance_with_currency"]

# OTP template formatting issue (WRONG)
body: "Your Ovii verification code is: {{1}}\n\nThis code..."
footer: "Ovii - Your Mobile Wallet"

# Fixed (CORRECT for AUTHENTICATION category)
body: "Your Ovii verification code is {{1}}. This code..."
footer: None  # AUTHENTICATION templates work better without footer
```

**Affected Templates:**
1. ✅ otp_verification (AUTHENTICATION category - reformatted for Meta compliance)
2. ✅ transaction_received
3. ✅ transaction_sent
4. ✅ deposit_confirmed
5. ✅ withdrawal_processed
6. ✅ referral_bonus_credited
7. ✅ payment_received
8. ✅ payment_sent

## Webhook URL Configuration

### Yes, you need to configure webhook URL and verify token in Meta!

#### Your Webhook URL
Based on your domain `api.ovii.it.com`, your webhook URL is:

```
https://api.ovii.it.com/api/integrations/webhooks/whatsapp/
```

#### Setup Steps

**1. Generate a Webhook Verify Token**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the generated token (e.g., `xK7pL9mN4qR2sT6vW8yZ1aB3cD5eF7gH9jK2lM4n`)

**2. Add to your `.env` file**
```bash
WHATSAPP_WEBHOOK_VERIFY_TOKEN=xK7pL9mN4qR2sT6vW8yZ1aB3cD5eF7gH9jK2lM4n
```

**3. Restart backend to load new token**
```bash
docker compose restart backend
```

**4. Configure in Meta Developer Console**
1. Go to https://developers.facebook.com/
2. Select your app
3. Navigate to **WhatsApp** → **Configuration**
4. In the **Webhook** section, click **Edit**
5. Enter:
   - **Callback URL**: `https://api.ovii.it.com/api/integrations/webhooks/whatsapp/`
   - **Verify Token**: `xK7pL9mN4qR2sT6vW8yZ1aB3cD5eF7gH9jK2lM4n` (your generated token)
6. Click **Verify and Save**

**5. Subscribe to Webhook Fields**
After verification, subscribe to:
- ✅ **messages** - Receive incoming messages
- ✅ **message_status** - Get delivery/read receipts

## All Commands You Can Use

### Template Management Commands

```bash
# Sync all templates to Meta (this should now work!)
docker compose exec backend python manage.py sync_whatsapp_templates

# Sync specific template
docker compose exec backend python manage.py sync_whatsapp_templates --template=transaction_received

# Check template status
docker compose exec backend python manage.py sync_whatsapp_templates --check-status

# Display templates without syncing
docker compose exec backend python manage.py sync_whatsapp_templates --display-only

# Display in JSON format
docker compose exec backend python manage.py sync_whatsapp_templates --display-only --format=json
```

### Database Commands

```bash
# Run migrations
docker compose exec backend python manage.py migrate

# Create migrations
docker compose exec backend python manage.py makemigrations

# Show migration status
docker compose exec backend python manage.py showmigrations

# Open Django shell
docker compose exec backend python manage.py shell

# Create superuser
docker compose exec backend python manage.py createsuperuser
```

### Docker & Container Commands

```bash
# View all logs
docker compose logs -f

# View backend logs only
docker compose logs -f backend

# View specific service logs
docker compose logs -f celery_worker
docker compose logs -f db

# Restart all services
docker compose restart

# Restart specific service
docker compose restart backend

# Check container status
docker compose ps

# Stop all services
docker compose down

# Start all services
docker compose up -d
```

### Monitoring & Debugging Commands

```bash
# Check environment variables
docker compose exec backend env | grep WHATSAPP
docker compose exec backend env | grep POSTGRES

# Check WhatsApp credentials
docker compose exec backend python manage.py shell -c "from integrations.services import WhatsAppClient; client = WhatsAppClient(); print(f'WABA ID: {client.waba_id}'); print(f'Phone ID: {client.phone_number_id}')"

# Test database connection
docker compose exec backend python manage.py dbshell

# Check Celery workers
docker compose exec celery_worker celery -A ovii_backend inspect active

# View static files location
docker compose exec backend python manage.py shell -c "from django.conf import settings; print(settings.STATIC_ROOT); print(settings.STATICFILES_DIRS)"
```

### Static Files Commands

```bash
# Collect static files
docker compose exec backend python manage.py collectstatic --noinput

# List static files directory
docker compose exec backend ls -la /home/app/web/staticfiles/

# Check static file configuration
docker compose exec backend python manage.py findstatic admin/css/base.css
```

### Database Backup & Restore

```bash
# Backup database
docker compose exec db pg_dump -U ovii_prod_user ovii_prod_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
docker compose exec -T db psql -U ovii_prod_user ovii_prod_db < backup_file.sql

# View database size
docker compose exec db psql -U ovii_prod_user -d ovii_prod_db -c "SELECT pg_size_pretty(pg_database_size('ovii_prod_db'));"
```

## Next Steps - What to Do Now

### 1. Restart Services to Apply Fixes
```bash
cd ~/ovii
docker compose restart backend celery_worker
```

### 2. Verify Static Files Warning is Gone
```bash
docker compose exec backend python manage.py check
```

You should NO LONGER see the static files warning.

### 3. Configure Webhook in Meta
Follow the webhook setup steps above to:
1. Generate verify token
2. Add to `.env`
3. Restart backend
4. Configure in Meta console

### 4. Sync WhatsApp Templates (Should Work Now!)
```bash
docker compose exec backend python manage.py sync_whatsapp_templates
```

**Expected Result:**
- All 14 templates should sync successfully or be marked as "already exists"
- NO 400 Bad Request errors for templates with currency

### 5. Check Template Status
```bash
docker compose exec backend python manage.py sync_whatsapp_templates --check-status
```

### 6. Monitor Logs
```bash
docker compose logs -f backend | grep -i whatsapp
```

## Testing the Fixes

### Test 1: Verify No Static Files Warning
```bash
docker compose exec backend python manage.py check --deploy
```

Expected: No `staticfiles.W004` warning

### Test 2: Verify Environment Variables
```bash
docker compose logs db 2>&1 | head -20
```

Expected: No "POSTGRES_USER" or "POSTGRES_DB" warnings

### Test 3: Verify Template Sync Works
```bash
docker compose exec backend python manage.py sync_whatsapp_templates
```

Expected: All templates sync successfully (or show as already approved)

### Test 4: Verify Webhook Endpoint
```bash
# After configuring in Meta, check logs
docker compose logs -f backend | grep -i webhook
```

## Documentation References

For detailed information, see:

1. **[FULL_COMMANDS_REFERENCE.md](./FULL_COMMANDS_REFERENCE.md)** - Complete command reference
2. **[WHATSAPP_TEMPLATE_MIGRATION_GUIDE.md](./WHATSAPP_TEMPLATE_MIGRATION_GUIDE.md)** - How to update code for new templates
3. **[WEBHOOK_SETUP_GUIDE.md](./WEBHOOK_SETUP_GUIDE.md)** - Detailed webhook configuration guide
4. **[WHATSAPP_INTEGRATION.md](./WHATSAPP_INTEGRATION.md)** - WhatsApp integration overview

## Summary

✅ **Fixed**: Static files warning
✅ **Fixed**: Environment variable warnings  
✅ **Fixed**: WhatsApp template 400 errors (duplicate currency variables)
✅ **Added**: Comprehensive documentation
✅ **Added**: Webhook setup instructions
✅ **Added**: Full commands reference

**Your webhook URL**: `https://api.ovii.it.com/api/integrations/webhooks/whatsapp/`

**Next action**: Configure webhook in Meta Developer Console using the steps above.

---

**Need Help?**
- Check logs: `docker compose logs -f backend`
- Review documentation in repository
- Contact: support@ovii.it.com
