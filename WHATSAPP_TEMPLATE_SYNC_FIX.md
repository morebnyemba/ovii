# WhatsApp Template Sync Fix - Issue g566

## Problem Summary
The `sync_whatsapp_templates` command was failing to create WhatsApp templates with:
- HTTP 400 Bad Request errors
- Error details (status_code, error_code, error_type) showing as "None"
- No detailed error message from Meta API visible
- 7 out of 14 templates failing to sync

## Root Cause Analysis

### Issue 1: Response Object Not Captured
When `requests.raise_for_status()` raised an `HTTPError`, the `e.response` attribute was sometimes `None`, causing all error details to be lost.

**Why this happened:**
- In some edge cases or network conditions, the HTTPError exception might not have the response properly attached
- The code was only checking `e.response` without a fallback

### Issue 2: Error Details Not Displayed
Even when error details were available in the exception, they were only shown if truthy (not None), making debugging difficult.

### Issue 3: Raw Response Not Visible
The actual Meta API error message in the response body was only logged at DEBUG level and never shown to the user, even in verbose mode.

## Changes Made

### 1. services.py - Improved Error Handling

#### Store Response Before raise_for_status()
```python
last_response = None  # Store for error handling

try:
    response = requests.post(url, json=template_data, headers=headers, timeout=30)
    last_response = response  # Capture for error handling
    
    # ... logging ...
    
    response.raise_for_status()
```

#### Fallback to Stored Response
```python
except requests.exceptions.HTTPError as e:
    # Use e.response if available, fallback to last_response
    response_obj = e.response if hasattr(e, 'response') and e.response is not None else last_response
    
    status_code = response_obj.status_code if response_obj else None
    response_text = response_obj.text if response_obj else None
```

#### Better Error Parsing
```python
if response_obj:
    try:
        error_data = response_obj.json()
    except (json.JSONDecodeError, ValueError, TypeError) as json_err:
        # Fallback to raw text if JSON parsing fails
        error_data = {"message": response_text}
else:
    # No response object available
    error_data = {"message": str(e)}
```

### 2. sync_whatsapp_templates.py - Enhanced Error Display

#### Always Show Key Fields (Even if None)
```python
# Always show these fields (even if None) for debugging
self.stdout.write(f"    HTTP Status: {status_code}")
self.stdout.write(f"    Error Code: {error_code}")
self.stdout.write(f"    Error Type: {error_type}")
```

#### Show Raw Response Immediately in Verbose Mode
```python
# In verbose mode, show raw response immediately
if verbose:
    raw_response = getattr(api_error, 'raw_response', None)
    if raw_response:
        self.stdout.write(self.style.WARNING(f"  Raw API Response:"))
        truncated_response = truncate_text(raw_response, MAX_ERROR_DISPLAY_LENGTH)
        self.stdout.write(f"    {truncated_response}")
```

## Testing Instructions

### 1. Rebuild Docker Image
```bash
docker compose build backend
```

### 2. Run Sync Command with Verbose Mode
```bash
docker compose exec backend python manage.py sync_whatsapp_templates --verbose
```

### 3. What to Look For

#### Expected Output with Fixes:
```
Processing template: otp_verification
  Checking template status in Meta...
  Template does not exist in Meta, will create...
  Template payload for Meta API:
    { ... payload ... }
  Raw API Response:
    { "error": { "code": 100, "message": "...", ... } }
  ✗ Failed: Meta API error: [actual error message]
    HTTP Status: 400
    Error Code: 100
    Error Type: OAuthException
    Details: [actual error details from Meta]
```

#### Key Improvements:
1. **HTTP Status will show actual value** (e.g., 400) instead of None
2. **Error Code will show actual value** (e.g., 100, 368, etc.) instead of None
3. **Raw API Response will be visible** showing exactly what Meta returned
4. **Detailed error message** from Meta API will be displayed

## Common Meta API Error Codes

Based on the Web search and Meta documentation:

| Error Code | Description | Solution |
|-----------|-------------|----------|
| 100 | Invalid parameter | Check template format, variable count, examples |
| 368 | Temporarily blocked due to policy violation | Review template content against Meta's policies |
| 4 | Too many requests | Wait and retry, or reduce request frequency |
| 80007 | Rate limit exceeded | Spread out API calls |
| 131031 | Template name already exists | Use a different name or update existing |
| 33 | Invalid template category | Use AUTHENTICATION, MARKETING, or UTILITY |

## Next Steps

### Once We See the Actual Error:

#### Scenario 1: Invalid Parameter (Code 100)
Common causes:
- Variable count mismatch between text and examples
- Invalid characters in template name
- Missing or incorrect format in components
- Language code not supported

**Fix:** Update template definitions in `whatsapp_templates.py`

#### Scenario 2: Policy Violation (Code 368)
Common causes:
- Template contains promotional content in wrong category
- URL/link issues
- Content violates WhatsApp policies

**Fix:** Modify template content to comply with policies

#### Scenario 3: Rate Limit (Code 4 or 80007)
**Fix:** Add delays between template creation:
```python
import time
# In _sync_templates_to_meta loop
time.sleep(2)  # Wait 2 seconds between templates
```

#### Scenario 4: Duplicate Template
**Fix:** Already handled - command skips existing templates

## Monitoring and Logs

### View Full Logs
```bash
# Backend logs
docker compose logs backend -f

# Filter for WhatsApp template errors
docker compose logs backend | grep -i "whatsapp\|template"
```

### Django Debug Level Logging
Set in settings or environment:
```python
LOGGING = {
    'loggers': {
        'integrations.services': {
            'level': 'DEBUG',  # Shows all request/response details
        },
    },
}
```

## Additional Improvements Made

### 1. Better Exception Attributes
All exceptions now have structured attributes:
- `status_code`: HTTP status code
- `error_code`: Meta API error code
- `error_type`: Error type from Meta
- `error_subcode`: Sub-error code
- `error_user_msg`: User-friendly message
- `fbtrace_id`: Facebook trace ID for support
- `raw_response`: Full response text
- `full_error`: Complete error object
- `is_duplicate`: Flag for duplicate template errors

### 2. Comprehensive Logging
- All errors logged at ERROR level
- Debug details logged at DEBUG level
- Request payloads logged before sending
- Response details logged after receiving

### 3. Graceful Degradation
- If response object is unavailable, use exception message
- If JSON parsing fails, use raw response text
- If error fields are missing, show None instead of crashing

## Rollback Plan

If issues arise:
```bash
git checkout HEAD~1 -- ovii_backend/integrations/services.py
git checkout HEAD~1 -- ovii_backend/integrations/management/commands/sync_whatsapp_templates.py
docker compose build backend
docker compose restart backend
```

## Support

If errors persist:
1. Share the full verbose output showing the actual Meta API response
2. Check Meta Business Manager for template status and rejection reasons
3. Review WhatsApp Business API documentation for template requirements
4. Contact Meta support with the `fbtrace_id` from error logs

## References

- [Meta WhatsApp Business Cloud API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages)
- [WhatsApp Template Message Policies](https://developers.facebook.com/docs/whatsapp/message-templates/guidelines)
- [Common Error Codes](https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes)
