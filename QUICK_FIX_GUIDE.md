# Quick Fix Guide: WhatsApp Template Sync Issues

## What Was Fixed

We identified and fixed the main issue causing template sync failures:

**The OTP template had a footer, but Meta WhatsApp API does NOT allow footers on AUTHENTICATION templates.**

## What To Do Next

### Step 1: Test the Fixed Sync Command

Run the sync command again with verbose mode to see if it works:

```bash
docker compose exec backend python manage.py sync_whatsapp_templates --verbose
```

### Step 2: Check What Happened

Look for these indicators in the output:

#### ✅ **SUCCESS - Template Created**
```
✓ Template created successfully (ID: 25397606133228629)
Status: PENDING
```
**Action:** Wait 24-48 hours for Meta approval. Check status with:
```bash
docker compose exec backend python manage.py sync_whatsapp_templates --check-status
```

#### ⚠️ **SKIPPED - Already Exists**
```
✓ Template already exists in Meta and is APPROVED
Template ID: 25397606133228629
```
**Action:** No action needed! Template is ready to use.

#### ❌ **FAILED - With Detailed Error**
```
✗ Failed: Meta API error: [error message]
HTTP Status: 400
Error Code: 132000
Error Type: OAuthException
Details: [detailed message]
```
**Action:** See "Error Code Quick Reference" below.

#### ❌ **FAILED - No Details (HTML Response)**
```
Response appears to be HTML instead of JSON
```
**Action:** Network/proxy issue. Check firewall/network settings.

## Error Code Quick Reference

### Error Code 100 - "Template already exists"
**Meaning:** Template already created in Meta.

**Solution:**
```bash
# Check status of existing template
docker compose exec backend python manage.py sync_whatsapp_templates --check-status
```

If approved, you're good to go! If rejected, you'll need to create a new version with a different name or fix the rejection reason.

### Error Code 132000 - "Invalid parameter"
**Meaning:** Template structure doesn't meet Meta requirements.

**Common Causes:**
- Missing required fields
- Invalid variable format
- Wrong component type for category

**Solution:** The OTP footer issue is now fixed. If you still get this, check the verbose output for specific field mentioned in error.

### Error Code 200 - "Permission denied"
**Meaning:** Access token doesn't have necessary permissions.

**Solution:**
1. Check WABA_ID in `.env` or admin panel
2. Verify access token has `whatsapp_business_management` permission
3. Token may have expired - generate new one in Meta Business Manager

### No Error Code - HTML Response
**Meaning:** Request not reaching Meta API (proxy/firewall).

**Solution:**
1. Check if container can reach graph.facebook.com:
   ```bash
   docker compose exec backend curl -I https://graph.facebook.com
   ```
2. Check firewall rules for outbound HTTPS
3. Check Docker network configuration

## Manual Template Creation

If automated sync continues to fail, create templates manually:

### For OTP Template (Most Important)

1. Go to [Meta Business Manager](https://business.facebook.com)
2. Navigate to **WhatsApp Manager** → **Message Templates**
3. Click **Create Template**
4. Fill in:
   - **Name:** `otp_verification`
   - **Category:** `Authentication`
   - **Language:** `English (US)`
   - **Body:** `Your Ovii verification code is {{1}}. This code expires in 5 minutes. Do not share this code with anyone.`
   - **Button:** Add "Copy Code" button (OTP type)
   - **Example:** `123456`
   - **Footer:** ❌ Leave empty (Authentication templates cannot have footers)
5. Click Submit

**See `META_TEMPLATE_CREATION_GUIDE.md` for detailed instructions on all templates.**

## Still Having Issues?

### Check Credentials

Verify your WhatsApp API credentials in Django admin or `.env`:
```bash
# In Django admin
http://your-domain/admin/integrations/whatsappconfig/

# Or check environment variables
docker compose exec backend env | grep WHATSAPP
```

Required:
- `WHATSAPP_WABA_ID` - Your WhatsApp Business Account ID
- `WHATSAPP_ACCESS_TOKEN` - Your access token (should be long, starting with "EAA...")
- `WHATSAPP_PHONE_NUMBER_ID` - Your phone number ID
- `WHATSAPP_API_VERSION` - API version (e.g., "v24.0")

### Check Logs

View detailed Django logs:
```bash
docker compose logs backend -f --tail=100
```

Look for lines starting with:
- `ERROR` - Shows what went wrong
- `INFO` - Shows successful operations
- `DEBUG` - Shows detailed request/response (only in verbose mode)

### Contact Support

If you've tried everything and still have issues:

1. **Gather Information:**
   - Run sync with `--verbose` flag
   - Copy the full output
   - Note which templates fail and which succeed
   - Check if any templates are already in Meta dashboard

2. **Check Meta Resources:**
   - [WhatsApp Business Platform Docs](https://developers.facebook.com/docs/whatsapp)
   - [Template Guidelines](https://developers.facebook.com/docs/whatsapp/message-templates/guidelines)
   - Meta Business Support in your WhatsApp Business Account dashboard

3. **Review Documentation:**
   - `META_TEMPLATE_CREATION_GUIDE.md` - Manual creation instructions
   - `WHATSAPP_SYNC_FIX_SUMMARY.md` - Detailed fix analysis
   - `WHATSAPP_TROUBLESHOOTING.md` - Additional troubleshooting

## Summary of Changes

We fixed these issues in the codebase:

✅ Removed footer from OTP template (AUTHENTICATION templates can't have footers)
✅ Added category-based validation to prevent future issues
✅ Improved error logging with detailed Meta API error information
✅ Added Content-Type checking to detect HTML responses
✅ Created comprehensive manual template creation guide
✅ Updated tests to reflect correct template structure

**The main fix:** The OTP template structure now complies with Meta's requirements for AUTHENTICATION templates.

---

**Need the detailed technical analysis?** See `WHATSAPP_SYNC_FIX_SUMMARY.md`

**Need to create templates manually?** See `META_TEMPLATE_CREATION_GUIDE.md`

**Date:** 2024-12-17
