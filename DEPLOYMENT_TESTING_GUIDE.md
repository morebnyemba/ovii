# WhatsApp Template Sync - Deployment & Testing Guide

## Quick Start

### 1. Deploy the Changes

```bash
# Pull latest changes
git pull origin copilot/fix-pkg-resources-deprecation-warning

# Rebuild Docker image
docker compose build backend

# Restart services
docker compose up -d

# Verify services are running
docker compose ps
```

### 2. Run the Sync Command

```bash
# Run with verbose mode to see detailed error information
docker compose exec backend python manage.py sync_whatsapp_templates --verbose
```

### 3. What to Expect

#### Before (Old Output):
```
ERROR: Failed to create WhatsApp template:
  Template: 'otp_verification'
  HTTP Status: None
  Error Code: None
  Error Type: None
  Message: None
  ✗ Failed: Meta API error: None
```

#### After (New Output):
```
Processing template: otp_verification
  Checking template status in Meta...
  Template does not exist in Meta, will create...
  Template payload for Meta API:
    {
      "name": "otp_verification",
      "category": "AUTHENTICATION",
      "language": "en_US",
      "components": [...]
    }
  Raw API Response:
    {
      "error": {
        "message": "Invalid parameter",
        "type": "OAuthException",
        "code": 100,
        "error_data": {...},
        "fbtrace_id": "..."
      }
    }
  ✗ Failed: Meta API error: Invalid parameter
    HTTP Status: 400
    Error Code: 100
    Error Type: OAuthException
    Details: The template parameter XYZ is invalid because...
    FB Trace ID: AbCdEfGh123456
  Waiting 1.5s before next template...
```

## Understanding the Output

### Success Cases
- **Template Created**: `✓ Template created successfully (ID: 123456)`
- **Already Exists**: `✓ Template already exists in Meta and is APPROVED`
- **Pending Approval**: `⏭ Template already exists and is PENDING approval`

### Error Cases

#### Error Code 100 - Invalid Parameter
**Meaning**: Template format or parameters are incorrect

**Common Causes**:
- Variable count mismatch
- Invalid template name format
- Missing required fields
- Incorrect component structure

**Solution**: Check the "Raw API Response" for specific field mentioned in error

#### Error Code 368 - Template Rejected
**Meaning**: Template violates WhatsApp's policies

**Common Causes**:
- Inappropriate content
- Misleading information
- Incorrect category usage
- URL/link policy violations

**Solution**: Review Meta's template policies and modify content

#### Error Code 4 / 80007 - Rate Limit
**Meaning**: Too many API requests

**Solution**: Increase delay or wait before retrying
```bash
docker compose exec backend python manage.py sync_whatsapp_templates --verbose --delay 3
```

#### Error Code 131031 - Duplicate Template
**Meaning**: Template with same name and language already exists

**Solution**: The command automatically handles this - template will be skipped

## Troubleshooting Steps

### Step 1: Identify the Error
Look for the error code and message in the output:
```
HTTP Status: 400
Error Code: 100
Error Type: OAuthException
Details: [specific error message]
```

### Step 2: Check Raw Response
In verbose mode, you'll see the complete Meta API response:
```
Raw API Response:
  {"error": {...}}
```

### Step 3: Check Template Payload
The payload sent to Meta is shown:
```
Template payload for Meta API:
  {...}
```

### Step 4: Fix the Issue

#### For Format Issues (Code 100):
1. Check template definition in `ovii_backend/integrations/whatsapp_templates.py`
2. Verify variable count matches placeholders ({{1}}, {{2}}, etc.)
3. Ensure examples array has correct structure
4. Validate language code format (en_US, not just en)

#### For Policy Issues (Code 368):
1. Review template content against WhatsApp policies
2. Change category if needed (AUTHENTICATION, MARKETING, UTILITY)
3. Remove any promotional language from non-MARKETING templates
4. Ensure URLs are valid and not shortened

#### For Rate Limits (Code 4/80007):
1. Increase delay: `--delay 2` or `--delay 3`
2. Wait 1 hour before retrying
3. Sync templates one at a time: `--template template_name`

### Step 5: Re-run Sync
After fixing issues:
```bash
docker compose exec backend python manage.py sync_whatsapp_templates --verbose
```

## Advanced Options

### Sync Single Template
```bash
docker compose exec backend python manage.py sync_whatsapp_templates \
  --template otp_verification \
  --verbose
```

### Custom Rate Limiting
```bash
# 2 second delay
docker compose exec backend python manage.py sync_whatsapp_templates \
  --verbose \
  --delay 2

# No delay (for testing)
docker compose exec backend python manage.py sync_whatsapp_templates \
  --verbose \
  --delay 0
```

### Check Template Status
```bash
docker compose exec backend python manage.py sync_whatsapp_templates \
  --check-status
```

### Display Templates (No Sync)
```bash
docker compose exec backend python manage.py sync_whatsapp_templates \
  --display-only
```

## Common Fixes

### Fix 1: Variable Count Mismatch

**Error**: "Parameter count mismatch"

**Solution**: Ensure example array has same number of values as placeholders
```python
# In whatsapp_templates.py
"body": "Your code is {{1}}. Expires in {{2}} minutes.",
"example": {
    "body_text": [["123456", "5"]]  # Must have 2 values
},
```

### Fix 2: Invalid Category

**Error**: "Category not allowed for template type"

**Solution**: Use appropriate category:
- **AUTHENTICATION**: OTPs, password resets, security codes
- **UTILITY**: Transaction notifications, account updates, reminders
- **MARKETING**: Promotional content, offers (requires opt-in)

```python
"category": "UTILITY",  # Not MARKETING for transaction notifications
```

### Fix 3: Language Code Format

**Error**: "Invalid language code"

**Solution**: Use full locale format (already handled in code):
```python
"language": "en_US"  # Not "en"
```

The code automatically converts "en" to "en_US", but if you see this error, check the conversion logic.

### Fix 4: Footer in AUTHENTICATION Templates

**Error**: "AUTHENTICATION templates cannot have footer"

**Solution**: Remove footer from AUTHENTICATION category templates:
```python
{
    "category": "AUTHENTICATION",
    "structure": {
        "body": "Your OTP is {{1}}",
        "footer": None,  # Must be None for AUTHENTICATION
    }
}
```

## Monitoring

### Check Logs
```bash
# Real-time logs
docker compose logs backend -f

# Filter for WhatsApp
docker compose logs backend | grep -i "whatsapp\|template"

# Last 100 lines
docker compose logs backend --tail 100
```

### Check Database
```bash
docker compose exec backend python manage.py shell

# In shell:
from integrations.models import WhatsAppTemplate
templates = WhatsAppTemplate.objects.all()
for t in templates:
    print(f"{t.name}: {t.status} (ID: {t.template_id})")
```

## Success Checklist

After running the sync command, you should have:

- [ ] Clear HTTP status codes (not None)
- [ ] Specific error codes from Meta API
- [ ] Detailed error messages explaining what's wrong
- [ ] Raw API response visible in verbose mode
- [ ] Template payloads shown for debugging
- [ ] Rate limiting working (delays between requests)
- [ ] Templates that already exist are properly skipped
- [ ] Database updated with template IDs and statuses

## Getting Help

### If Templates Still Fail:

1. **Copy the full verbose output** from the sync command
2. **Check the FB Trace ID** in the error output
3. **Review the template payload** shown in verbose mode
4. **Check Meta Business Manager** for template status:
   - https://business.facebook.com/wa/manage/message-templates/
5. **Contact Meta Support** with the FB Trace ID if needed

### Documentation References

- [Meta WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api/)
- [Template Message Format](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages#template-messages)
- [Template Components](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/components)
- [Error Codes](https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes)

### Internal Documentation

- `WHATSAPP_TEMPLATE_SYNC_FIX.md` - Technical details of the fix
- `WHATSAPP_INTEGRATION.md` - General WhatsApp integration guide
- `WHATSAPP_TROUBLESHOOTING.md` - Troubleshooting guide

## Next Steps After Successful Sync

1. **Wait for Approval**: Templates go through Meta review (24-48 hours)
2. **Check Status**: Use `--check-status` to monitor approval
3. **Test Templates**: Send test messages once approved
4. **Monitor Quality**: Watch for template quality ratings in Meta Business Manager

## Important Notes

- **Rate Limiting**: Default 1.5s delay prevents throttling
- **Approval Time**: New templates take 24-48 hours for Meta approval
- **Quality Ratings**: Low quality ratings can get templates paused
- **Policy Compliance**: Always follow WhatsApp's template policies
- **Testing**: Test templates in sandbox before production use

## Emergency Rollback

If something goes wrong:
```bash
# Rollback code changes
git checkout HEAD~4 -- ovii_backend/integrations/services.py
git checkout HEAD~4 -- ovii_backend/integrations/management/commands/sync_whatsapp_templates.py

# Rebuild
docker compose build backend
docker compose restart backend
```

See `WHATSAPP_TEMPLATE_SYNC_FIX.md` for detailed rollback instructions.
