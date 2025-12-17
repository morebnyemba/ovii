# WhatsApp Template Sync Troubleshooting Guide

This guide helps you diagnose and fix WhatsApp template synchronization issues.

## Quick Diagnosis

Run the sync command with verbose flag to see detailed error information:

```bash
docker compose exec backend python manage.py sync_whatsapp_templates --verbose
```

---

## Common Issues and Solutions

### Issue 1: 400 Bad Request Errors Without Details

**Symptom:**
```
ERROR: Failed to create template 'template_name': HTTP None, 400 Client Error: Bad Request
```

**Solution:**

1. **Run with verbose flag** to see detailed error information:
   ```bash
   docker compose exec backend python manage.py sync_whatsapp_templates --verbose
   ```

2. **Check the detailed error output** for:
   - Error Code
   - Error Type
   - Error Subcode
   - User Title
   - User Message
   - FB Trace ID

3. **Common 400 error causes:**

   **a) Template already exists**
   - Error Code: 100
   - Message: "Template name already exists"
   - Solution: The template already exists in Meta. Run `--check-status` to verify:
     ```bash
     docker compose exec backend python manage.py sync_whatsapp_templates --check-status
     ```

   **b) Invalid template format**
   - Error Code: 132000
   - Message: "Invalid parameter"
   - Solution: Check template structure. Common issues:
     - Missing required fields
     - Invalid variable placeholders
     - Incorrect component types
   
   **c) Variable count mismatch**
   - Message: "Number of variables in body doesn't match example"
   - Solution: Ensure `example.body_text` has the correct number of variables

   **d) Invalid language code**
   - Message: "Invalid language"
   - Solution: Use proper language codes (en_US, es_ES, etc.)

   **e) Category restrictions**
   - Message: "Invalid template category"
   - Solution: 
     - AUTHENTICATION templates: Should NOT have footer, limited to OTP/security codes
     - MARKETING templates: Can have footer, for promotional content
     - UTILITY templates: For transactional/account updates

---

### Issue 2: Static Files Warning

**Symptom:**
```
?: (staticfiles.W004) The directory '/home/app/web/static' in the STATICFILES_DIRS setting does not exist.
```

**Cause:**
The `STATICFILES_DIRS` environment variable is set to a directory that doesn't exist.

**Solution:**

1. **Check your `.env` file** for `STATICFILES_DIRS`:
   ```bash
   grep STATICFILES_DIRS .env
   ```

2. **Remove or comment it out** if you're not using custom static directories:
   ```env
   # STATICFILES_DIRS=/home/app/web/static
   ```

3. **OR create the directory** if you need it:
   ```bash
   docker compose exec backend mkdir -p /home/app/web/static
   ```

4. **Restart backend service**:
   ```bash
   docker compose restart backend
   ```

---

### Issue 3: POSTGRES Environment Variable Warnings

**Symptom:**
```
WARN[0000] The "POSTGRES_USER" variable is not set. Defaulting to a blank string.
WARN[0000] The "POSTGRES_DB" variable is not set. Defaulting to a blank string.
```

**Cause:**
Docker Compose expects `POSTGRES_USER` and `POSTGRES_DB` variables, but they're not set in `.env`.

**Solution:**

1. **Add to your `.env` file**:
   ```env
   POSTGRES_DB=ovii_db
   POSTGRES_USER=ovii_user
   POSTGRES_PASSWORD=your_password
   ```

2. **Restart database service**:
   ```bash
   docker compose restart db backend
   ```

---

### Issue 4: Template Approval Status

**Symptom:**
Templates are created but not working.

**Diagnosis:**

1. **Check template status**:
   ```bash
   docker compose exec backend python manage.py sync_whatsapp_templates --check-status
   ```

2. **Possible statuses:**
   - `PENDING`: Waiting for Meta approval (24-48 hours)
   - `APPROVED`: Ready to use
   - `REJECTED`: Review rejection reason
   - `DISABLED`: Template was disabled

**Solution:**

- **PENDING**: Wait for Meta approval (usually 24-48 hours)
- **REJECTED**: 
  1. Check rejection reason in admin panel
  2. Fix the issue
  3. Create a new version with a different name
- **DISABLED**: Contact Meta support

---

### Issue 5: WABA_ID Not Configured

**Symptom:**
```
ERROR: WABA_ID not configured. Set WHATSAPP_WABA_ID in settings
```

**Solution:**

1. **Find your WABA ID** in Meta Business Manager:
   - Go to https://business.facebook.com/
   - Navigate to WhatsApp Business Account → Settings
   - Copy your WhatsApp Business Account ID

2. **Add to `.env` file**:
   ```env
   WHATSAPP_WABA_ID=your_waba_id_here
   ```

3. **OR add in Django admin panel**:
   - Go to http://your-domain/admin/
   - Navigate to Integrations → WhatsApp Configs
   - Edit active configuration
   - Add WABA ID field
   - Save

4. **Restart backend**:
   ```bash
   docker compose restart backend
   ```

---

### Issue 6: Webhook Not Configured

**Symptom:**
Meta shows "Webhook not configured" or webhook verification fails.

**Solution:**

1. **Get your webhook URL**:
   ```
   Format: https://your-domain.com/api/integrations/whatsapp/webhook/
   Example: https://api.ovii.it.com/api/integrations/whatsapp/webhook/
   ```

2. **Generate verification token**:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

3. **Add to `.env` file**:
   ```env
   WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_generated_token
   ```

4. **Configure in Meta Developer Console**:
   - Go to https://developers.facebook.com/
   - Select your app → WhatsApp → Configuration
   - Click "Edit" in Webhook section
   - Set Callback URL: `https://api.ovii.it.com/api/integrations/whatsapp/webhook/`
   - Set Verify Token: (paste token from .env)
   - Click "Verify and Save"
   - Subscribe to webhook fields:
     - messages
     - message_status
     - messaging_postbacks (optional)

5. **Test webhook**:
   ```bash
   curl "https://api.ovii.it.com/api/integrations/whatsapp/webhook/?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test"
   ```
   Expected response: `test`

---

### Issue 7: Access Token Issues

**Symptom:**
```
ERROR: WhatsApp access token not configured
```
or
```
ERROR: 401 Unauthorized
```

**Solution:**

1. **Generate new access token** in Meta for Developers:
   - Go to https://developers.facebook.com/
   - Select your app → WhatsApp → API Setup
   - Generate new token (System User Token recommended for production)

2. **Update `.env` file**:
   ```env
   WHATSAPP_ACCESS_TOKEN=your_new_token
   ```

3. **For production, use System User Token**:
   - Go to Meta Business Manager
   - Business Settings → System Users
   - Create or select system user
   - Assign WhatsApp permissions
   - Generate token
   - Use this token in `.env`

4. **Restart backend**:
   ```bash
   docker compose restart backend
   ```

---

## Debugging Templates

### View Template Definition

Display a specific template structure:

```bash
docker compose exec backend python manage.py sync_whatsapp_templates --display-only --format=json | grep -A 30 "template_name"
```

### Test Single Template

Sync only one template with verbose output:

```bash
docker compose exec backend python manage.py sync_whatsapp_templates --template=otp_verification --verbose
```

### Check Template in Meta

1. Go to Meta Business Manager
2. WhatsApp Business Account → Message Templates
3. Search for your template
4. Check status and any error messages

### Common Template Issues

**1. Variable Placeholder Format**
- ✅ Correct: `{{1}}`, `{{2}}`, `{{3}}`
- ❌ Wrong: `{1}`, `{{var}}`, `${1}`

**2. Example Values**
Must match the number of variables:
```python
"variables": ["name", "amount", "date"],
"example": {
    "body_text": [["John", "100.00", "2025-01-15"]]  # 3 values
}
```

**3. AUTHENTICATION Templates**
- Should NOT have footer
- Limited to security/OTP codes
- Can have up to 1 button (for OTP autofill)

**4. MARKETING Templates**
- Can have footer
- Used for promotional content
- Need explicit user opt-in

**5. UTILITY Templates**
- For transactional updates
- Can have footer
- Automatic opt-in

---

## Advanced Troubleshooting

### Enable Debug Logging

1. **In Django shell**:
   ```bash
   docker compose exec backend python manage.py shell
   ```

2. **Set logger level**:
   ```python
   import logging
   logger = logging.getLogger('integrations.services')
   logger.setLevel(logging.DEBUG)
   ```

3. **Check logs**:
   ```bash
   docker compose logs -f backend | grep "integrations.services"
   ```

### View Full Error Response

With `--verbose` flag, check logs for:
```
DEBUG: Full error response: {...}
DEBUG: Failed request payload: {...}
```

### Check Meta API Version

Ensure you're using a supported API version:

```env
WHATSAPP_API_VERSION=v24.0  # Current version
```

### Verify Credentials

```bash
docker compose exec backend python manage.py shell
```

```python
from integrations.services import WhatsAppClient

client = WhatsAppClient()
print(f"Phone Number ID: {client.phone_number_id}")
print(f"Access Token: {client.access_token[:20]}...")  # First 20 chars
print(f"WABA ID: {client.waba_id}")
print(f"API Version: {client.api_version}")
```

---

## Meta API Error Codes Reference

| Error Code | Meaning | Solution |
|------------|---------|----------|
| 100 | Invalid parameter or duplicate | Check template format or verify it doesn't already exist |
| 132000 | Template name already exists | Use a different name or delete existing template |
| 132001 | Template limit reached | Delete unused templates or contact Meta support |
| 132005 | Template rejected by Meta | Check rejection reason and fix issues |
| 132015 | Invalid template format | Verify template structure matches Meta requirements |
| 190 | Access token issue | Generate new access token |
| 200 | Permission denied | Ensure WhatsApp permissions are granted to your app |
| 368 | Temporarily blocked | Wait and try again later |

---

## Getting Help

### Check Logs

```bash
# Backend logs
docker compose logs -f backend

# All logs
docker compose logs -f

# Last 100 lines
docker compose logs --tail=100 backend
```

### Environment Check

```bash
# View all WhatsApp variables
docker compose exec backend env | grep WHATSAPP

# View PostgreSQL variables
docker compose exec backend env | grep POSTGRES
```

### Contact Meta Support

If issues persist:
1. Note the FB Trace ID from error message
2. Go to https://developers.facebook.com/support/
3. Select WhatsApp Business Platform
4. Provide FB Trace ID and error details

---

## Resources

- **WhatsApp Cloud API Docs**: https://developers.facebook.com/docs/whatsapp/cloud-api
- **Template Guidelines**: https://developers.facebook.com/docs/whatsapp/message-templates/guidelines
- **Meta Business Manager**: https://business.facebook.com/
- **Meta Developer Console**: https://developers.facebook.com/

---

**Author**: Moreblessing Nyemba  
**Copyright**: © 2025 Moreblessing Nyemba & Ovii. All Rights Reserved.
