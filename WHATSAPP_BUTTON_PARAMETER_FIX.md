# WhatsApp OTP Template Button Parameter Fix

## Issue Summary

**Error**: WhatsApp OTP template failing with error **#131008**
```
Required parameter is missing
buttons: Button at index 0 of type Url requires a parameter
```

## Root Cause

The `otp_verification` template was manually created in Meta Business Manager with a **URL button** instead of an **OTP/Copy Code button**. When sending template messages, URL buttons require a parameter to be passed, but the code wasn't providing this parameter.

## Solution Implemented

Added URL button parameter support to handle manually created templates with URL buttons.

### Code Changes

**File**: `ovii_backend/integrations/whatsapp_templates.py`

1. **Added fallback flag** to OTP template definition:
```python
"otp_verification": {
    ...
    "has_url_button_fallback": True,  # NEW
}
```

2. **Updated `format_template_components()`** to include button parameters:
```python
# Handle fallback for manually created templates with URL buttons
if template.get("has_url_button_fallback", False):
    if "code" in variables:
        components.append({
            "type": "button",
            "sub_type": "url",
            "index": "0",
            "parameters": [
                {
                    "type": "text",
                    "text": str(variables["code"])
                }
            ]
        })
```

### Result

The WhatsApp API payload now includes both body and button components:

```json
{
  "messaging_product": "whatsapp",
  "to": "263787211325",
  "type": "template",
  "template": {
    "name": "otp_verification",
    "language": {"code": "en_US"},
    "components": [
      {
        "type": "body",
        "parameters": [{"type": "text", "text": "123456"}]
      },
      {
        "type": "button",
        "sub_type": "url",
        "index": "0",
        "parameters": [{"type": "text", "text": "123456"}]
      }
    ]
  }
}
```

This satisfies Meta's requirement for templates with URL buttons.

## Testing

✅ Code syntax validated
✅ Mock test passed - components correctly formatted
✅ Test suite updated to expect 2 components for OTP template
⏳ Integration testing pending deployment

## Recommendations for Long-Term Solution

The current fix is a **workaround** for improperly created templates. The **proper solution** is to recreate the template using the automated sync command, which will create it with the correct OTP button structure (no URL parameters needed).

### Steps to Properly Recreate Template

1. **Delete the manually created template in Meta Business Manager:**
   - Go to Meta Business Manager → WhatsApp Manager
   - Navigate to Message Templates
   - Find `otp_verification` template
   - Delete it

2. **Run the sync command to recreate it properly:**
   ```bash
   python manage.py sync_whatsapp_templates --template otp_verification --verbose
   ```

3. **Wait for approval** (usually 24-48 hours)

4. **Verify template status:**
   ```bash
   python manage.py sync_whatsapp_templates --check-status --template otp_verification
   ```

5. **Remove the fallback flag** after template is properly created:
   - Edit `ovii_backend/integrations/whatsapp_templates.py`
   - Remove `"has_url_button_fallback": True,` from OTP template
   - This will make the code cleaner and more efficient

### Why This is Better

When created properly using the sync command:
- Meta automatically handles the OTP button (no parameters needed)
- The template uses Meta's native "Copy Code" button type
- Better user experience (one-tap copy functionality)
- Cleaner code (no button parameters to send)
- Follows Meta's best practices for authentication templates

## Deployment Notes

1. **Current fix is backward compatible** - works with both:
   - Manually created templates with URL buttons (current situation)
   - Properly created templates with OTP buttons (future state)

2. **No breaking changes** - existing templates continue to work

3. **Celery workers** will need to be restarted for the changes to take effect

## Verification After Deployment

1. Trigger an OTP request in the application
2. Check Celery logs for successful template sending
3. Verify user receives OTP via WhatsApp
4. Confirm no more error #131008 in logs

## References

- [WhatsApp Business API - Authentication Templates](https://developers.facebook.com/docs/whatsapp/business-management-api/authentication-templates/)
- [Meta Template Creation Guide](./META_TEMPLATE_CREATION_GUIDE.md)
- [Previous WhatsApp OTP Fix Summary](./WHATSAPP_OTP_FIX_SUMMARY.md)

## Files Modified

- `ovii_backend/integrations/whatsapp_templates.py` - Added button parameter support
- `ovii_backend/integrations/tests.py` - Updated test to expect 2 components for OTP template

## Author

Fixed by: GitHub Copilot
Date: 2025-12-17
