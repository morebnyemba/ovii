# Issue Fix Summary

## Overview

This document summarizes the fixes implemented to resolve the following issues:

1. Static files warning about missing `/home/app/web/static` directory
2. PostgreSQL environment variable warnings
3. Insufficient WhatsApp template sync error logging
4. Missing webhook configuration documentation

---

## Changes Made

### 1. Enhanced WhatsApp Template Error Logging

**Files Modified:**
- `ovii_backend/integrations/services.py`
- `ovii_backend/integrations/management/commands/sync_whatsapp_templates.py`

**Improvements:**

✅ **Detailed error extraction from Meta API responses:**
- Error Code
- Error Type
- Error Subcode
- Error User Title
- Error User Message
- FB Trace ID

✅ **New `--verbose` flag** for debug-level logging:
```bash
docker compose exec backend python manage.py sync_whatsapp_templates --verbose
```

✅ **Request payload logging** in verbose mode to help debug template format issues

✅ **Enhanced error display** in command output showing all available error details

**Example Output:**
```
Processing template: otp_verification
  Checking template status in Meta...
  Template does not exist in Meta, will create...
  ✗ Failed: Meta API error: Invalid template format
    Error Code: 132015
    Error Type: OAuthException
    Error Subcode: 2388008
    Title: Invalid Template Format
    Details: The body text contains invalid variable placeholders
    FB Trace ID: AaBbCcDdEeFfGg
```

---

### 2. Environment Configuration Documentation

**Files Modified:**
- `.env.example`

**Improvements:**

✅ **Added clear comments** for POSTGRES variables:
```env
# IMPORTANT: Always set these to avoid Docker Compose warnings
POSTGRES_DB=ovii_db
POSTGRES_USER=ovii_user
POSTGRES_PASSWORD=your_database_password
```

✅ **Added comprehensive webhook configuration section:**
- Webhook URL format and examples
- Step-by-step Meta Developer Console setup
- Webhook verification token generation
- Field subscription instructions

---

### 3. Test Fixes

**Files Modified:**
- `ovii_backend/integrations/tests.py`

**Fixes:**

✅ **Fixed `test_convert_template_to_meta_format`**
- Corrected assertion: AUTHENTICATION templates should NOT have footers
- Added new test for MARKETING templates that DO have footers

✅ **Fixed `test_format_template_components_multiple_variables`**
- Updated to use correct variable names (e.g., `amount_with_currency` instead of separate `amount` and `currency`)
- Fixed expected parameter count from 6 to 4

---

### 4. Comprehensive Documentation

**New Files Created:**

#### `WHATSAPP_COMMANDS_REFERENCE.md`
Complete reference for all WhatsApp-related commands:
- Template management (display, sync, check status)
- Webhook configuration
- Database management
- Docker commands
- Troubleshooting commands

#### `WHATSAPP_TROUBLESHOOTING.md`
Detailed troubleshooting guide covering:
- Common 400 Bad Request error causes and solutions
- Static files warning resolution
- POSTGRES variable warnings
- Template approval status handling
- WABA_ID configuration
- Webhook setup and verification
- Access token issues
- Template debugging techniques
- Meta API error codes reference

---

## What You Need To Do

### Step 1: Update Your `.env` File

Add the following variables if not already present:

```env
# PostgreSQL Variables (required to eliminate warnings)
POSTGRES_DB=ovii_db
POSTGRES_USER=ovii_user
POSTGRES_PASSWORD=your_secure_password

# Remove or comment out STATICFILES_DIRS if set to non-existent directory
# STATICFILES_DIRS=/home/app/web/static
```

### Step 2: Restart Services

```bash
docker compose restart backend db
```

### Step 3: Run Template Sync with Verbose Logging

```bash
docker compose exec backend python manage.py sync_whatsapp_templates --verbose
```

This will now show **detailed error information** for any failing templates, including:
- Specific error codes
- Detailed error messages from Meta
- FB Trace IDs for support requests
- Request payloads for debugging

### Step 4: Review Error Details

Look at the verbose output to understand why each template is failing. Common issues:

**Example 1: Template Already Exists**
```
Error Code: 100
Message: Template name already exists
```
✅ Solution: Run `--check-status` to verify existing templates

**Example 2: Invalid Format**
```
Error Code: 132015
Details: The body text contains invalid variable placeholders
```
✅ Solution: Check template definition in `whatsapp_templates.py`

**Example 3: Variable Count Mismatch**
```
Message: Number of variables doesn't match example
```
✅ Solution: Verify `example.body_text` has correct number of values

### Step 5: Configure Webhook (If Not Done)

If you haven't configured the webhook in Meta Developer Console:

1. **Generate verification token:**
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. **Add to `.env`:**
   ```env
   WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_generated_token
   ```

3. **Configure in Meta Developer Console:**
   - URL: `https://api.ovii.it.com/api/integrations/whatsapp/webhook/`
   - Verify Token: (paste from .env)
   - Subscribe to: messages, message_status

See `WHATSAPP_COMMANDS_REFERENCE.md` for detailed steps.

---

## Resources

### Documentation Files

- **`WHATSAPP_COMMANDS_REFERENCE.md`** - Complete command reference
- **`WHATSAPP_TROUBLESHOOTING.md`** - Detailed troubleshooting guide
- **`.env.example`** - Updated with all required variables and webhook documentation

### Quick Commands

```bash
# Sync with detailed error logging
docker compose exec backend python manage.py sync_whatsapp_templates --verbose

# Check template status
docker compose exec backend python manage.py sync_whatsapp_templates --check-status

# Sync specific template
docker compose exec backend python manage.py sync_whatsapp_templates --template=otp_verification --verbose

# View logs
docker compose logs -f backend

# Check environment variables
docker compose exec backend env | grep WHATSAPP
docker compose exec backend env | grep POSTGRES
```

---

## Expected Results

After implementing these changes:

1. ✅ **No more POSTGRES warnings** - Docker Compose will use the configured variables
2. ✅ **Static files warning documented** - Clear solution in troubleshooting guide
3. ✅ **Detailed error messages** - You'll see exactly why templates fail with error codes, types, and FB Trace IDs
4. ✅ **Better debugging** - Request payloads logged in verbose mode
5. ✅ **Complete documentation** - Two comprehensive guides for commands and troubleshooting

---

## Understanding Template Failures

The 7 templates that are failing likely have one of these issues:

### Common Causes:

1. **Already exist in Meta** (most likely)
   - Check with: `--check-status`
   - Solution: They might be pending approval or already approved

2. **Invalid format**
   - Check with: `--verbose` flag
   - Look for error code 132015

3. **Variable mismatch**
   - Example values don't match variable count
   - Check template definitions

4. **Category restrictions**
   - AUTHENTICATION templates can't have footers
   - MARKETING templates need user opt-in

### To Diagnose:

Run with verbose flag and look for the specific error details:

```bash
docker compose exec backend python manage.py sync_whatsapp_templates --verbose 2>&1 | tee sync_output.log
```

This will:
- Show detailed errors in terminal
- Save output to `sync_output.log` for review
- Include error codes, types, and messages

---

## Next Steps

1. ✅ Update `.env` file with POSTGRES variables
2. ✅ Restart services
3. ✅ Run sync with `--verbose` flag
4. ✅ Review detailed error output
5. ✅ Fix identified issues
6. ✅ Configure webhook if needed

If issues persist after reviewing the verbose output, check:
- `WHATSAPP_TROUBLESHOOTING.md` for solutions
- Meta Business Manager for template status
- FB Trace IDs in errors for Meta support

---

## Support

For additional help:
- Review `WHATSAPP_TROUBLESHOOTING.md` for detailed solutions
- Review `WHATSAPP_COMMANDS_REFERENCE.md` for command usage
- Contact Meta support with FB Trace IDs from error messages

**Author**: Moreblessing Nyemba  
**Copyright**: © 2025 Moreblessing Nyemba & Ovii. All Rights Reserved.
