# WhatsApp Cloud API Integration

This document describes the WhatsApp Business Cloud API integration for the Ovii platform.

## Overview

Ovii uses the WhatsApp Business Cloud API to send OTP codes, transaction notifications, and other important messages to users. The integration uses the `heyoo` Python SDK to interact with Meta's WhatsApp Business Platform.

## Features

- **OTP Delivery**: Send verification codes via WhatsApp for secure authentication
- **Transaction Notifications**: Real-time notifications for money transfers, deposits, and withdrawals
- **Template Messages**: Pre-approved message templates for consistent, compliant messaging
- **Fallback Support**: Graceful fallback if WhatsApp is unavailable
- **Multi-channel**: Works alongside Email, SMS, Push, and In-App notifications

## Setup

### 1. Prerequisites

You need:
- A Meta Business Account
- A WhatsApp Business Account linked to your Meta Business Account
- A verified phone number for your WhatsApp Business Account
- API access enabled in Meta Business Manager

### 2. Configure Environment Variables

Add the following to your `.env` file:

```bash
# WhatsApp Business Account Phone Number ID (from Meta Business Manager)
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# WhatsApp Business API Access Token (from Meta for Developers)
WHATSAPP_ACCESS_TOKEN=your_access_token

# WhatsApp API Version (e.g., v18.0, v19.0)
WHATSAPP_API_VERSION=v18.0

# Webhook Verification Token (set this in Meta developer console)
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token
```

### 3. Get Your Credentials

#### Phone Number ID
1. Go to https://business.facebook.com/
2. Navigate to WhatsApp Manager
3. Select your WhatsApp Business Account
4. Go to API Setup
5. Copy the "Phone number ID"

#### Access Token
1. In the same API Setup page
2. Click on "Generate token" or use an existing System User token
3. Copy the access token (starts with `EAAG...`)

**Important**: For production, use a System User token, not a temporary access token.

### 4. Install Dependencies

The `heyoo` SDK is already included in `requirements.txt`:

```bash
pip install -r requirements.txt
```

## Message Templates

WhatsApp requires pre-approved message templates for sending notifications. Templates must be created in Meta Business Manager before use.

### View Available Templates

Run the management command to see all defined templates:

```bash
python manage.py sync_whatsapp_templates
```

For JSON output:
```bash
python manage.py sync_whatsapp_templates --format=json
```

### Template Categories

#### 1. Authentication (OTP)
- **Template Name**: `otp_verification`
- **Purpose**: Send verification codes for login/signup
- **Variables**: code
- **Example**: "Your Ovii verification code is: 123456..."

#### 2. Transaction Notifications
- **transaction_received**: Money received notification
- **transaction_sent**: Money sent notification
- **deposit_confirmed**: Deposit confirmation
- **withdrawal_processed**: Withdrawal confirmation

#### 3. Onboarding
- **welcome_message**: Welcome new users

### Creating Templates in Meta

1. Go to https://business.facebook.com/wa/manage/message-templates/
2. Click "Create Template"
3. Enter the template name (must match exactly)
4. Select the category (AUTHENTICATION or MARKETING)
5. Add the message body with variables (use `{{1}}`, `{{2}}`, etc.)
6. Add footer text if needed
7. Submit for approval
8. Wait 24-48 hours for Meta approval

**Note**: Templates must be approved before they can be used in production.

## Usage

### Sending OTPs

OTPs are automatically sent via WhatsApp when users request them:

```python
# This happens automatically in the OTP generation task
from users.tasks import generate_and_log_otp

otp_request_id = generate_and_log_otp.delay("+263777123456")
```

### Sending Transaction Notifications

Transaction notifications are automatically sent when transactions complete. The system uses the `transaction_completed` signal:

```python
# This happens automatically via signals
# When a transaction completes, WhatsApp notifications are sent
```

### Manual Template Sending

To send a template message manually:

```python
from notifications.services import send_whatsapp_template

response = send_whatsapp_template(
    phone_number="+263777123456",
    template_name="otp_verification",
    variables={"code": "123456"}
)
```

### Sending Simple Text Messages

For non-template messages (requires 24-hour message window):

```python
from integrations.services import WhatsAppClient

client = WhatsAppClient()
response = client.send_text_message(
    phone_number="+263777123456",
    message="Hello from Ovii!"
)
```

## Architecture

### Components

1. **WhatsAppClient** (`integrations/services.py`)
   - Low-level client for WhatsApp API
   - Handles authentication and API calls
   - Uses `heyoo` SDK

2. **Template Manager** (`integrations/whatsapp_templates.py`)
   - Defines all message templates
   - Formats template variables
   - Provides template metadata

3. **Notification Service** (`notifications/services.py`)
   - High-level notification functions
   - Integrates with Notification model
   - Handles errors and logging

4. **Celery Tasks** (`notifications/tasks.py`)
   - Asynchronous message sending
   - Background processing
   - Retry logic

### Notification Flow

```
User Action → Signal/View → Create Notification → Celery Task → WhatsApp API → User's WhatsApp
```

### Channel Priority

For transaction notifications, the system sends via multiple channels:
1. In-App (WebSocket) - instant
2. WhatsApp - primary external channel
3. Email - if available
4. Push - mobile app

## Testing

### Run Tests

```bash
# Run WhatsApp integration tests
DATABASE_ENGINE=sqlite DATABASE_NAME=:memory: python manage.py test integrations.tests notifications.tests

# Run specific test class
DATABASE_ENGINE=sqlite DATABASE_NAME=:memory: python manage.py test integrations.tests.WhatsAppClientTestCase
```

### Test Coverage

- WhatsApp client initialization
- Message sending (text and template)
- Template formatting
- Notification model integration
- Error handling
- Fallback scenarios

## Error Handling

The integration includes comprehensive error handling:

1. **Missing Credentials**: Logs warning, doesn't crash
2. **API Failures**: Marks notification as FAILED, logs error
3. **Invalid Templates**: Raises ValueError with clear message
4. **Network Issues**: Caught and logged

Example error log:
```
ERROR Failed to send WhatsApp notification 123: API Error
```

## Monitoring

### Key Metrics to Monitor

1. **Delivery Rate**: % of notifications with status SENT
2. **Failure Rate**: % of notifications with status FAILED
3. **Template Rejections**: Track failed template approvals
4. **API Errors**: Monitor for rate limiting or authentication issues

### Logs

All WhatsApp operations are logged:
- Successful sends: `INFO` level
- Failures: `ERROR` level
- Configuration issues: `WARNING` level

Check logs:
```bash
tail -f logs/ovii.log | grep -i whatsapp
```

## Troubleshooting

### Issue: Messages Not Sending

**Symptoms**: Notifications stay in PENDING status

**Possible Causes**:
1. Invalid credentials → Check `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN`
2. Template not approved → Verify template status in Meta Business Manager
3. Phone number format → Ensure format is `+[country_code][number]`
4. Celery not running → Check `celery -A ovii_backend worker -l info`

### Issue: Template Variables Not Populating

**Symptoms**: Variables show as `{{1}}` instead of actual values

**Possible Causes**:
1. Missing variables in function call
2. Wrong variable names
3. Template format mismatch

**Solution**: Check template definition in `whatsapp_templates.py`

### Issue: Rate Limiting

**Symptoms**: API returns 429 error

**Solution**:
1. Reduce message frequency
2. Implement exponential backoff
3. Contact Meta for rate limit increase

## Security

### Best Practices

1. **Never commit access tokens**: Use environment variables
2. **Rotate tokens regularly**: Generate new tokens every 60-90 days
3. **Use System User tokens**: For production, not temporary tokens
4. **Validate webhook signatures**: Verify incoming webhook authenticity
5. **Monitor unusual activity**: Set up alerts for high failure rates

### Token Security

- Store tokens in `.env` file (gitignored)
- Use different tokens for development and production
- Restrict token permissions to minimum required
- Never log tokens in application logs

## Cost Considerations

WhatsApp Business API has costs:
- **Conversation-based pricing**: Charged per 24-hour conversation window
- **Template categories**: AUTHENTICATION messages may have different rates than MARKETING
- **User-initiated vs. Business-initiated**: User replies are free for 24 hours

See current pricing: https://developers.facebook.com/docs/whatsapp/pricing

## Development vs. Production

### Development
- Use test phone numbers
- Lower rate limits
- Templates can use "Test" category
- Free tier available

### Production
- Requires verified business
- Higher rate limits
- All templates must be approved
- Billing setup required

## Resources

- [WhatsApp Business Platform Documentation](https://developers.facebook.com/docs/whatsapp)
- [heyoo SDK GitHub](https://github.com/Neurotech-HQ/heyoo)
- [Message Templates Guide](https://developers.facebook.com/docs/whatsapp/message-templates)
- [WhatsApp Business Manager](https://business.facebook.com/)

## Support

For issues with:
- **Ovii Integration**: Contact development team
- **WhatsApp API**: Check Meta Developer Forums
- **Account Setup**: Contact Meta Business Support

## Changelog

### Version 1.0.0 (2024-12-09)
- Initial WhatsApp Cloud API integration
- Added OTP delivery via WhatsApp
- Implemented transaction notifications
- Created 6 message templates
- Added comprehensive tests
- Created management command for template sync
