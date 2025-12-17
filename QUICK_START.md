# 🚀 Quick Start Guide - Ovii Deployment

**Issue Fixed**: ✅ Staticfiles warning resolved  
**Webhook Setup**: 📋 Complete guide below

---

## 🔧 1. Staticfiles Warning - FIXED ✅

The warning `(staticfiles.W004) The directory '/home/app/web/static' in STATICFILES_DIRS does not exist` has been **automatically fixed**.

No action needed! The fix will work immediately on your next deployment or restart.

---

## 🔌 2. WhatsApp Webhook Setup - ACTION REQUIRED ⏩

### Your Webhook URL:
```
https://api.ovii.it.com/api/integrations/webhooks/whatsapp/
```

### Quick Setup (3 Steps):

#### Step 1: Set Verify Token

**Option A - Django Admin (Recommended):**
```
1. Go to: https://api.ovii.it.com/admin/
2. Navigate to: Integrations > WhatsApp Configurations
3. Edit active config
4. Set "Webhook Verify Token": your_secure_token
5. Save
```

**Option B - Environment Variable:**
```bash
# Add to .env file
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_secure_token_here
```

💡 **Generate secure token:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### Step 2: Configure in Meta

```
1. Go to: https://developers.facebook.com/apps/
2. Select your app
3. Navigate to: WhatsApp > Configuration > Webhook
4. Click: Edit
5. Set:
   - Callback URL: https://api.ovii.it.com/api/integrations/webhooks/whatsapp/
   - Verify Token: (same as Step 1)
6. Click: Verify and Save
7. Subscribe to:
   ✅ messages
   ✅ message_status
```

#### Step 3: Test Webhook

```bash
# Test verification (should return: test123)
curl "https://api.ovii.it.com/api/integrations/webhooks/whatsapp/?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"

# Monitor webhook events
docker compose logs -f backend | grep -i whatsapp
```

---

## 📋 3. Essential Commands Reference

### Most Common Commands

```bash
# Start services
docker compose up -d

# Restart backend
docker compose restart backend

# View logs
docker compose logs -f backend

# Run migrations
docker compose exec backend python manage.py migrate

# Sync WhatsApp templates
docker compose exec backend python manage.py sync_whatsapp_templates

# Check template status
docker compose exec backend python manage.py sync_whatsapp_templates --check-status

# Open Django shell
docker compose exec backend python manage.py shell

# Collect static files
docker compose exec backend python manage.py collectstatic --noinput

# Create superuser
docker compose exec backend python manage.py createsuperuser
```

### Database Commands

```bash
# Connect to PostgreSQL
docker compose exec db psql -U $DATABASE_USER -d $DATABASE_NAME

# Backup database
docker compose exec db pg_dump -U $DATABASE_USER $DATABASE_NAME > backup.sql

# Restore database
cat backup.sql | docker compose exec -T db psql -U $DATABASE_USER -d $DATABASE_NAME
```

### WhatsApp Template Commands

```bash
# Sync all templates to Meta
docker compose exec backend python manage.py sync_whatsapp_templates

# Sync specific template
docker compose exec backend python manage.py sync_whatsapp_templates --template=otp_verification

# Check approval status
docker compose exec backend python manage.py sync_whatsapp_templates --check-status

# Display templates (without syncing)
docker compose exec backend python manage.py sync_whatsapp_templates --display-only

# Display in JSON format
docker compose exec backend python manage.py sync_whatsapp_templates --display-only --format=json
```

### Troubleshooting Commands

```bash
# Check Django configuration
docker compose exec backend python manage.py check

# Check for deployment issues
docker compose exec backend python manage.py check --deploy

# View all Docker containers
docker compose ps

# View resource usage
docker stats

# Check network connectivity
docker compose exec backend ping db
docker compose exec backend ping redis

# View Redis data
docker compose exec redis redis-cli
docker compose exec redis redis-cli INFO

# View Celery active tasks
docker compose exec celery_worker celery -A ovii_backend inspect active

# View Celery registered tasks
docker compose exec celery_worker celery -A ovii_backend inspect registered
```

---

## 📚 Full Documentation

For complete details, see:

1. **`FIXES_SUMMARY.md`** - Complete webhook setup guide and all commands
2. **`DEPLOYMENT_COMMANDS.md`** - Comprehensive deployment command reference
3. **`WHATSAPP_INTEGRATION.md`** - Full WhatsApp integration documentation
4. **`WHATSAPP_TEMPLATE_TROUBLESHOOTING.md`** - Template sync troubleshooting

---

## ✅ Checklist for Production

- [x] Staticfiles warning fixed
- [ ] Webhook URL configured in Meta Business Manager
- [ ] Webhook verify token set (Django Admin or .env)
- [ ] Webhook tested and verified
- [ ] Templates synced to Meta
- [ ] Template approval status checked
- [ ] Webhook monitoring enabled

---

## 🆘 Need Help?

```bash
# View logs
docker compose logs -f backend

# Check health
docker compose exec backend python manage.py check

# Contact
support@ovii.it.com
```

---

**Copyright © 2025 Moreblessing Nyemba & Ovii. All Rights Reserved.**
