# WhatsApp Template Sync - Error Handling & Logging Improvements

## Overview
This document describes the improvements made to the WhatsApp template sync error handling and logging system to provide better debugging and troubleshooting capabilities.

## Issues Resolved

### 1. Error Responses Showing "None" Values
**Problem**: When template sync failed, all error fields showed "None":
```
HTTP Status: None
Error Code: None
Error Type: None
Message: None
```

**Root Cause**: The error response JSON parsing was failing silently, causing all error extraction to fail.

**Solution**: Implemented multiple fallback strategies:
- Try to parse JSON response
- Log JSON parsing failures
- Fall back to raw response text if JSON parsing fails
- Use multiple field names for error extraction (e.g., `code` or `error_code`)
- Provide truncated raw text as final fallback

### 2. Missing Request/Response Logging
**Problem**: In verbose mode, no detailed request/response information was logged.

**Solution**: Added comprehensive logging:
- Request URL logging
- Request payload logging
- Response status code logging
- Response headers logging
- Raw response text logging (when JSON parsing fails)

### 3. Silent JSON Parsing Failures
**Problem**: When `response.json()` failed, the exception was caught but not logged.

**Solution**: 
- Explicitly detect and log JSON parsing errors
- Store the parsing error type and message
- Fall back to raw response text
- Show both the JSON error and raw response in debug logs

### 4. Insufficient Error Context
**Problem**: Network errors, timeouts, and other exceptions didn't include context like template name or URL.

**Solution**: Enhanced all exception handlers to include:
- Template name
- Request URL
- Full traceback for unexpected errors
- Error type classification

## Usage

### Running Sync with Verbose Mode

To get detailed error information during template sync:

```bash
python manage.py sync_whatsapp_templates --verbose
```

Or in Docker:
```bash
docker compose exec backend python manage.py sync_whatsapp_templates --verbose
```

### What Verbose Mode Shows

1. **Request Details**:
   - API endpoint URL
   - Request payload (template structure)
   - Request parameters

2. **Response Details**:
   - HTTP status code
   - Response headers
   - Response body (parsed or raw)

3. **Error Information**:
   - HTTP status code
   - Meta error code
   - Error type
   - Error subcode
   - User-friendly error title
   - Detailed error message
   - FB Trace ID (for Meta support)
   - Raw response (if JSON parsing failed)

4. **Template Status Checks**:
   - Whether template exists in Meta
   - Current approval status
   - Template ID from Meta
   - Language matching logic

## Error Information Now Available

### For HTTP Errors
- **status_code**: HTTP status code (e.g., 400, 401, 403, 500)
- **error_code**: Meta API error code (e.g., 100, 190, 200)
- **error_type**: Error classification (e.g., "OAuthException", "GraphMethodException")
- **error_subcode**: Additional error classification
- **error_user_title**: User-friendly error title
- **error_user_msg**: Detailed user-friendly message
- **fbtrace_id**: Meta's trace ID for support requests
- **raw_response**: Raw response text (if JSON parsing failed)

### For Network Errors
- **error_type**: "ConnectionError"
- **template_name**: Name of template being synced
- **request_url**: API endpoint that failed

### For Timeout Errors
- **error_type**: "Timeout"
- **template_name**: Name of template being synced
- **request_url**: API endpoint that timed out

### For Other Request Errors
- **error_type**: Exception class name
- **template_name**: Name of template being synced
- **request_url**: API endpoint that failed

## Example Output

### Before Improvements
```
Processing template: otp_verification
  Checking template status in Meta...
  Template does not exist in Meta, will create...
ERROR Failed to create WhatsApp template:
  Template: 'otp_verification'
  HTTP Status: None
  Error Code: None
  Error Type: None
  Message: None
  ✗ Failed: Meta API error: None
```

### After Improvements
```
Processing template: otp_verification
  Checking template status in Meta...
DEBUG Request URL: https://graph.facebook.com/v24.0/123456789/message_templates?name=otp_verification
DEBUG Response status code: 200
  Template does not exist in Meta, will create...
DEBUG Creating template 'otp_verification'
DEBUG Request URL: https://graph.facebook.com/v24.0/123456789/message_templates
DEBUG Request payload: {'name': 'otp_verification', 'category': 'AUTHENTICATION', ...}
DEBUG Response status code: 400
ERROR Failed to create WhatsApp template:
  Template: 'otp_verification'
  HTTP Status: 400
  Error Code: 100
  Error Type: OAuthException
  Error Subcode: 2000
  Message: Invalid parameter: components
  User Message: The template components are invalid. Please check the documentation.
  FB Trace ID: AbCdEfGhIjKlMnOp
  ✗ Failed: Meta API error: Invalid parameter: components
    HTTP Status: 400
    Error Code: 100
    Error Type: OAuthException
    Error Subcode: 2000
    Details: The template components are invalid. Please check the documentation.
    FB Trace ID: AbCdEfGhIjKlMnOp
```

## Debugging Tips

### 1. Always Use Verbose Mode First
When troubleshooting sync issues, always start with verbose mode:
```bash
python manage.py sync_whatsapp_templates --verbose
```

### 2. Check Logs
Look at the Django logs for DEBUG level messages:
```bash
# In Docker
docker compose logs backend | grep -A 10 "Failed to create"

# Or view live logs
docker compose logs -f backend
```

### 3. Check for Common Issues

#### Authentication Errors (Error Code 190)
- Check that WHATSAPP_ACCESS_TOKEN is valid and not expired
- Verify token has necessary permissions

#### Invalid Parameter Errors (Error Code 100)
- Check template structure against Meta's requirements
- Verify category is one of: AUTHENTICATION, MARKETING, UTILITY
- Ensure language code is in Meta's supported format (e.g., en_US not en)
- Validate template variables match example values

#### Template Already Exists
- Not an error - template is already in Meta
- Run sync again to update local database with Meta status
- Use `--check-status` to see current approval status

#### Network/Connection Errors
- Check internet connectivity
- Verify Meta's Graph API is accessible
- Check firewall rules

### 4. Understanding Error Codes

Common Meta API error codes:
- **100**: Invalid parameter or request
- **190**: Access token expired or invalid
- **200**: Permission denied
- **368**: Temporarily blocked (rate limiting)
- **900**: Template name already exists

### 5. Using FB Trace ID
If you need to contact Meta support, provide the FB Trace ID from the error output. This helps Meta engineers locate the exact request in their systems.

## Code Changes Summary

### services.py
1. Enhanced `create_template()` method:
   - Added request/response logging
   - Improved JSON parsing with error detection
   - Multiple fallback strategies for error extraction
   - Better error context in exceptions

2. Enhanced `get_template_status()` method:
   - Added request logging
   - Improved error message extraction
   - Better error handling for different error types

3. Improved all exception handlers:
   - Added template name and URL context
   - Added full traceback logging
   - Better error type classification

### sync_whatsapp_templates.py
1. Enhanced error display:
   - Show HTTP status code
   - Show all available error fields
   - Show raw response in verbose mode
   - Better categorization of status check errors

2. Improved status check error handling:
   - Separate handlers for network, parsing, and unexpected errors
   - Show error details in verbose mode
   - Continue with creation attempt after check failures

## Testing

A test suite validates the error handling improvements:

```bash
python /tmp/test_error_parsing.py
```

Tests cover:
- Valid JSON response parsing
- JSON parsing failure with fallback
- Empty/None error field handling
- Duplicate template detection
- Multiple error message extraction strategies

## Future Improvements

Potential enhancements:
1. Add retry logic for transient errors (rate limiting, timeouts)
2. Cache template status to reduce API calls
3. Batch template creation/status checks
4. Add webhook for template approval notifications
5. Create troubleshooting guide for specific error codes
6. Add metrics/monitoring for sync success rates

## Related Documentation

- [WHATSAPP_INTEGRATION.md](../WHATSAPP_INTEGRATION.md) - WhatsApp Business API setup
- [WHATSAPP_TEMPLATE_MIGRATION_GUIDE.md](../WHATSAPP_TEMPLATE_MIGRATION_GUIDE.md) - Template migration guide
- [WHATSAPP_TROUBLESHOOTING.md](../WHATSAPP_TROUBLESHOOTING.md) - General troubleshooting

## Support

If you encounter issues not covered here:
1. Run sync with `--verbose` flag
2. Check DEBUG logs
3. Look for FB Trace ID in error output
4. Review Meta's Graph API error documentation
5. Contact Meta support with FB Trace ID if needed
