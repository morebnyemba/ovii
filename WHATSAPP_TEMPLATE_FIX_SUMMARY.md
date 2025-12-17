# WhatsApp Template Sync Fix Summary

**Date:** December 17, 2025
**Issue:** Meta API errors preventing WhatsApp templates from being created

## Problems Identified

### 1. OTP Verification Template (Error Code: 2388042)
**Error Message:** `component of type BODY has unexpected field(s) (text)`

**Root Cause:** AUTHENTICATION category templates with OTP buttons should use `add_security_recommendation: true` instead of the `text` field in the BODY component. This is a Meta API requirement for OTP authentication templates.

**Solution:**
- Modified `otp_verification` template body text to be simple: `"{{1}} is your Ovii verification code."`
- Updated `convert_template_to_meta_format()` function to detect AUTHENTICATION templates with OTP buttons
- For these templates, the function now uses `add_security_recommendation: true` instead of including the `text` field
- Meta will auto-generate the body text in the format: `"<CODE> is your verification code."`

### 2. Transaction Templates (Error Code: 2388293)
**Error Message:** `This template has too many variables for its length. Reduce the number of variables or increase the message length.`

**Affected Templates:**
- `transaction_received`
- `transaction_sent`
- `payment_received`

**Root Cause:** These templates had 4 variables but the body text was too short (~60-90 characters). Meta enforces a minimum text-to-variable ratio to prevent spam-like templates.

**Solution:**
- Expanded body text from ~60-90 characters to 189-205 characters
- Maintained the same 4 variables
- New ratio: ~47-51 characters per variable (well above Meta's threshold)

**Example Changes:**
- Before: `"You have received {{1}} from {{2}}.\n\nNew balance: {{3}}\n\nTransaction ID: {{4}}"`
- After: `"Good news! You have successfully received a payment of {{1}} from {{2}}. Your wallet has been updated and your new balance is {{3}}. For your records, the transaction ID is {{4}}. Thank you for using Ovii!"`

### 3. Deposit/Withdrawal Templates (Error Code: 2388299)
**Error Message:** `Variables can't be at the start or end of the template.`

**Affected Templates:**
- `deposit_confirmed`
- `withdrawal_processed`

**Root Cause:** Templates started with variables (e.g., `"Your deposit of {{1}} has been confirmed..."`), which violates Meta's policy against leading or trailing variables.

**Solution:**
- Added introductory text before the first variable
- Moved variable position from position 0 to positions 59-71

**Example Changes:**
- Before: `"Your deposit of {{1}} has been confirmed..."`
- After: `"Great news! We have successfully confirmed your deposit of {{1}}..."`

## Technical Implementation

### Modified Files
1. **`ovii_backend/integrations/whatsapp_templates.py`**
   - Updated template definitions for 6 templates
   - Modified `convert_template_to_meta_format()` function to handle OTP templates

### Code Changes
```python
# Before (incorrect for OTP templates)
body_component = {
    "type": "BODY",
    "text": structure["body"]
}

# After (correct for OTP templates)
has_otp_button = any(
    button.get("type") == "OTP" 
    for button in structure.get("buttons", [])
)

if template["category"] == "AUTHENTICATION" and has_otp_button:
    body_component["add_security_recommendation"] = True
else:
    body_component["text"] = structure["body"]
```

## Validation Results

All templates now pass Meta API validation:

✅ **otp_verification**: Uses `add_security_recommendation` (no text field)
✅ **transaction_received**: 205 chars, 4 variables (51.2 chars/var)
✅ **transaction_sent**: 189 chars, 4 variables (47.2 chars/var)
✅ **payment_received**: 198 chars, 4 variables (49.5 chars/var)
✅ **deposit_confirmed**: First variable at position 59 (after intro text)
✅ **withdrawal_processed**: First variable at position 71 (after intro text)

## Testing Instructions

To verify the templates are correctly formatted:

```bash
cd ovii_backend

# Test OTP template conversion
python -c "from integrations.whatsapp_templates import convert_template_to_meta_format; import json; print(json.dumps(convert_template_to_meta_format('otp_verification'), indent=2))"

# Sync templates to Meta (production)
docker compose exec backend python manage.py sync_whatsapp_templates --verbose
```

## References

- Meta WhatsApp Business API Documentation: https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates
- Meta Authentication Template Requirements: https://developers.facebook.com/docs/whatsapp/business-management-api/authentication-templates
- Template Component Specifications: https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/components

## Author

Moreblessing Nyemba
© 2025 Ovii. All Rights Reserved.
