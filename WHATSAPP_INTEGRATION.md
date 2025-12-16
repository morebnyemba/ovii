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

### 2. Configuration Options

**Ovii supports two ways to configure WhatsApp credentials:**

#### Option A: Database Configuration (Recommended for Production)

Configure WhatsApp credentials through the Django Admin panel for runtime control:

1. Log in to the Django Admin panel at `/admin/`
2. Navigate to **Integrations > WhatsApp Configurations**
3. Click **Add WhatsApp Configuration**
4. Fill in the required fields:
   - **WABA ID**: Your WhatsApp Business Account ID (required for template sync)
   - **Phone Number ID**: Your WhatsApp Business Phone Number ID
   - **Access Token**: Your WhatsApp Business API Access Token
   - **API Version**: e.g., `v18.0` or `v19.0`
   - **Webhook Verify Token**: (Optional) Your webhook verification token
   - **Active**: Check to make this configuration active
5. Click **Save**

**Benefits of Database Configuration:**
- Update credentials without restarting the application
- Runtime control and easy credential rotation
- Audit trail with created_at and updated_at timestamps
- Only one active configuration allowed at a time
- Supports automated template sync with WABA_ID

#### Option B: Environment Variables (Backward Compatible)

Add the following to your `.env` file:

```bash
# WhatsApp Business Account ID (WABA ID) - Required for template sync
WHATSAPP_WABA_ID=your_waba_id

# WhatsApp Business Account Phone Number ID (from Meta Business Manager)
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# WhatsApp Business API Access Token (from Meta for Developers)
WHATSAPP_ACCESS_TOKEN=your_access_token

# WhatsApp API Version (e.g., v18.0, v19.0)
WHATSAPP_API_VERSION=v18.0

# Webhook Verification Token (set this in Meta developer console)
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token
```

**Note**: Database configuration takes precedence over environment variables. If no database configuration exists, the system falls back to environment variables.

### 3. Get Your Credentials

#### WABA ID (WhatsApp Business Account ID)
1. Go to https://business.facebook.com/
2. Navigate to WhatsApp Manager
3. Select your WhatsApp Business Account
4. The WABA ID is shown in the URL or in the account details
5. Format: Usually a long numeric ID (e.g., `102290129340398`)


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

WhatsApp requires pre-approved message templates for sending notifications. Ovii now supports **automatic template synchronization** to Meta via the Graph API.

### Automated Template Sync (Recommended)

Ovii can automatically create and sync templates to Meta Business Manager:

#### Prerequisites
1. Configure your **WABA_ID** (WhatsApp Business Account ID):
   - Option A: Add to `.env` file: `WHATSAPP_WABA_ID=your_waba_id`
   - Option B: Add to Django Admin under **Integrations > WhatsApp Configurations**

2. Ensure you have a valid **access token** with permissions:
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`

#### Sync All Templates to Meta

```bash
# Sync all templates to Meta (creates them via Graph API)
python manage.py sync_whatsapp_templates

# Sync a specific template
python manage.py sync_whatsapp_templates --template=otp_verification

# Check approval status of templates
python manage.py sync_whatsapp_templates --check-status
```

#### Display Templates Without Syncing

```bash
# View templates in text format (without syncing)
python manage.py sync_whatsapp_templates --display-only

# View templates in JSON format
python manage.py sync_whatsapp_templates --display-only --format=json
```

#### What Happens During Sync?

1. **Template Creation**: Each template is automatically created in Meta via the Graph API
2. **Status Tracking**: Templates are tracked in the database with status (PENDING, APPROVED, REJECTED)
3. **Approval Process**: Templates are submitted to Meta for review (usually 24-48 hours)
4. **Error Handling**: If a template already exists or fails, the error is logged

**Note**: After sync, templates are in PENDING status until Meta approves them. Use `--check-status` to monitor approval progress.

### Manual Template Creation (Alternative)

If you prefer to create templates manually or automatic sync fails:

1. Go to https://business.facebook.com/wa/manage/message-templates/
2. Click "Create Template"
3. Use the output from `python manage.py sync_whatsapp_templates --display-only` as a guide
4. Enter the template name (must match exactly)
5. Select the category (AUTHENTICATION or MARKETING)
6. Add the message body with variables (use `{{1}}`, `{{2}}`, etc.)
7. Add footer text if needed
8. Submit for approval
9. Wait 24-48 hours for Meta approval

### View Available Templates

Run the management command to see all defined templates:

```bash
python manage.py sync_whatsapp_templates --display-only
```

For JSON output:
```bash
python manage.py sync_whatsapp_templates --display-only --format=json
```

### Template Categories

#### 1. Authentication (OTP)
- **Template Name**: `otp_verification`
- **Purpose**: Send verification codes for login/signup
- **Variables**: code
- **Example**: "Your Ovii verification code is: 123456..."

#### 2. Transaction Notifications - Success
- **transaction_received**: Money received notification
- **transaction_sent**: Money sent notification
- **deposit_confirmed**: Deposit confirmation
- **withdrawal_processed**: Withdrawal confirmation
- **payment_received**: Merchant payment received
- **payment_sent**: Customer payment to merchant

#### 3. Transaction Notifications - Failures
- **transaction_failed**: Generic transaction failure notification
- **deposit_failed**: Deposit/top-up failure notification
- **withdrawal_failed**: Withdrawal failure notification

#### 4. KYC & Verification
- **kyc_approved**: KYC document approved notification
- **kyc_rejected**: KYC document rejected notification

#### 5. Referral Program
- **referral_bonus_credited**: Referral bonus credited notification

#### 6. Onboarding
- **welcome_message**: Welcome new users

### Template Sync Management

#### Check Template Status
Monitor the approval status of your templates:

```bash
# Check status of all templates
python manage.py sync_whatsapp_templates --check-status

# Check status of a specific template
python manage.py sync_whatsapp_templates --check-status --template=otp_verification
```

#### Template Status Values
- **PENDING**: Template created but awaiting Meta approval
- **APPROVED**: Template approved and ready to use
- **REJECTED**: Template rejected by Meta (check rejection reason in admin)
- **DISABLED**: Template was previously approved but has been disabled

#### View Template Sync Status in Admin
1. Log in to Django Admin at `/admin/`
2. Navigate to **Integrations > WhatsApp Templates**
3. View sync status, template IDs, and rejection reasons

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

## Migrating to Database Configuration

If you're currently using environment variables and want to migrate to database configuration:

1. **Log in to Django Admin** and navigate to **Integrations > WhatsApp Configurations**
2. **Create a new configuration** with your existing credentials from `.env`
3. **Verify it works** by sending a test message
4. **Remove credentials from `.env`** (optional, but recommended for security)
5. The system will automatically use database credentials once available

**Rollback**: If you need to revert, simply deactivate the database configuration or remove it, and the system will fall back to environment variables.

## Webhook Configuration

### Overview

WhatsApp Business Cloud API uses webhooks to notify your application about:
- Incoming messages from users
- Message delivery status (sent, delivered, read, failed)
- Account updates and events

### Webhook Endpoint

Your WhatsApp webhook URL is:
```
https://your-domain.com/api/integrations/webhooks/whatsapp/
```

**For production**: Replace `your-domain.com` with your actual domain (e.g., `api.ovii.it.com`)

**For development/testing**: You can use ngrok or similar tools to expose your local server:
```bash
ngrok http 8000
# Use the HTTPS URL provided by ngrok
```

### Configuration Steps

#### Step 1: Set Verify Token

The webhook requires a verify token for security. Choose one method:

**Option A: Via Django Admin (Recommended)**

1. Navigate to `https://your-domain.com/admin/`
2. Go to **Integrations > WhatsApp Configurations**
3. Edit the active configuration
4. Set **Webhook Verify Token** to a secure random string (e.g., `ovii_webhook_2024_secure_token`)
5. Click **Save**

**Option B: Via Environment Variables**

Add to your `.env` file:
```bash
WHATSAPP_WEBHOOK_VERIFY_TOKEN=ovii_webhook_2024_secure_token
```

⚠️ **Important**: Use a strong, random token. You can generate one with:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### Step 2: Configure Webhook in Meta Business Manager

1. **Access Meta Developer Portal**
   - Go to https://developers.facebook.com/apps/
   - Select your WhatsApp Business app

2. **Navigate to Webhook Settings**
   - In the left sidebar, click **WhatsApp > Configuration**
   - Find the **Webhook** section
   - Click **Edit**

3. **Configure Webhook**
   - **Callback URL**: Enter your webhook URL
     ```
     https://your-domain.com/api/integrations/webhooks/whatsapp/
     ```
   - **Verify Token**: Enter the same token from Step 1
     ```
     ovii_webhook_2024_secure_token
     ```
   - Click **Verify and Save**

4. **Subscribe to Webhook Fields**
   
   After verification, subscribe to these fields:
   - ✅ **messages** - Receive incoming messages (recommended)
   - ✅ **message_status** - Track delivery/read status (recommended)
   - ☐ **messaging_handovers** - For customer service handoffs (optional)
   - ☐ **message_echoes** - Echo sent messages (optional)

   Click **Subscribe** for each field you want to enable.

#### Step 3: Verify Webhook

Test that your webhook is configured correctly:

**Via Meta Console**
1. In the Webhook section, click **Test** button
2. Select a field (e.g., `messages`)
3. Click **Send Test Request**
4. Check your application logs

**Via Application Logs**
```bash
docker compose logs -f backend | grep -i whatsapp
```

You should see:
```
INFO WhatsApp webhook received: {...}
```

**Manual Test with cURL**
```bash
# Test GET (verification)
curl "https://your-domain.com/api/integrations/webhooks/whatsapp/?hub.mode=subscribe&hub.verify_token=ovii_webhook_2024_secure_token&hub.challenge=123456789"

# Should return: 123456789

# Test POST (webhook notification)
curl -X POST https://your-domain.com/api/integrations/webhooks/whatsapp/ \
  -H "Content-Type: application/json" \
  -d '{"entry": [{"changes": [{"value": {"messages": []}}]}]}'

# Should return: {"status": "received"}
```

### Webhook Events

The webhook receives different types of events:

#### 1. Incoming Messages

```json
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "263777123456",
          "id": "wamid.xxx",
          "timestamp": "1234567890",
          "type": "text",
          "text": {
            "body": "Hello Ovii"
          }
        }]
      }
    }]
  }]
}
```

#### 2. Message Status Updates

```json
{
  "entry": [{
    "changes": [{
      "value": {
        "statuses": [{
          "id": "wamid.xxx",
          "status": "delivered",
          "timestamp": "1234567890",
          "recipient_id": "263777123456"
        }]
      }
    }]
  }]
}
```

### Implementation Details

The webhook view (`WhatsAppWebhookView`) automatically:

1. **Verifies webhook** (GET request during setup)
2. **Receives notifications** (POST requests from Meta)
3. **Logs all events** for debugging
4. **Returns 200 OK** to acknowledge receipt

Current implementation logs events for monitoring. To enable two-way messaging or status tracking, update the `_handle_incoming_message()` and `_handle_status_update()` methods in `integrations/views.py`.

### Monitoring Webhook Activity

**View Webhook Logs**
```bash
# Real-time monitoring
docker compose logs -f backend | grep -i "whatsapp webhook"

# Recent webhook events
docker compose logs --tail=100 backend | grep -i "whatsapp webhook"

# Search for specific message
docker compose logs backend | grep -i "message from +263777123456"
```

**Common Log Messages**
- `WhatsApp webhook verified successfully` - Verification completed
- `WhatsApp webhook received:` - Incoming webhook notification
- `Incoming WhatsApp message from...` - User sent a message
- `WhatsApp message status update:` - Delivery status changed

### Troubleshooting Webhook Issues

#### Issue: Webhook Verification Failed

**Symptoms**: Meta shows "Verification Failed" error

**Solutions**:
1. Check verify token matches exactly (case-sensitive)
2. Ensure webhook URL is accessible from internet
3. Check application logs for error messages
4. Verify Django ALLOWED_HOSTS includes your domain
5. Test webhook URL manually with cURL

**Debug Commands**:
```bash
# Check if webhook endpoint is accessible
curl -I https://your-domain.com/api/integrations/webhooks/whatsapp/

# Check Django settings
docker compose exec backend python manage.py shell
>>> from django.conf import settings
>>> print(settings.ALLOWED_HOSTS)
>>> print(settings.WHATSAPP_WEBHOOK_VERIFY_TOKEN)

# Check WhatsAppConfig
>>> from integrations.models import WhatsAppConfig
>>> config = WhatsAppConfig.objects.filter(is_active=True).first()
>>> print(config.webhook_verify_token if config else "No config")
```

#### Issue: Webhook Not Receiving Events

**Symptoms**: No logs when messages are sent/received

**Solutions**:
1. Verify webhook fields are subscribed in Meta console
2. Check webhook URL is correct
3. Ensure application is running and accessible
4. Review firewall/security group settings
5. Check Nginx/proxy configuration

**Verification**:
```bash
# Send test message via WhatsApp
# Then check logs immediately
docker compose logs --tail=50 backend | grep -i whatsapp

# Check if webhook endpoint returns 200
curl -X POST https://your-domain.com/api/integrations/webhooks/whatsapp/ \
  -H "Content-Type: application/json" \
  -d '{"entry":[]}'
```

#### Issue: Webhook Returns Errors

**Symptoms**: Meta shows webhook failing

**Solutions**:
1. Webhook must return 200 OK within 10 seconds
2. Fix any application errors causing crashes
3. Ensure database is accessible
4. Check for memory/resource issues

**Debug**:
```bash
# Monitor errors in real-time
docker compose logs -f backend | grep -E "(ERROR|CRITICAL)"

# Check application health
docker compose exec backend python manage.py check

# Test webhook processing
docker compose exec backend python manage.py shell
>>> from integrations.views import WhatsAppWebhookView
>>> view = WhatsAppWebhookView()
>>> # Test with sample data
```

### Security Considerations

1. **Verify Token Security**
   - Use a strong, random token (32+ characters)
   - Never expose token in client-side code
   - Rotate token regularly (every 90 days)

2. **Webhook Signature Verification** (Optional Enhancement)
   - Meta can sign webhook requests with HMAC
   - Verify signature to ensure requests are from Meta
   - Prevent replay attacks

3. **Rate Limiting**
   - Implement rate limiting on webhook endpoint
   - Prevent abuse and DoS attacks
   - Monitor unusual activity patterns

4. **HTTPS Required**
   - Webhook URL must use HTTPS
   - Valid SSL certificate required
   - Meta rejects HTTP webhooks

### Development vs. Production

**Development**
```bash
# Use ngrok for local testing
ngrok http 8000

# Update webhook URL in Meta console
https://abc123.ngrok.io/api/integrations/webhooks/whatsapp/

# Monitor ngrok requests
# Visit http://127.0.0.1:4040 for request inspector
```

**Production**
```bash
# Use your production domain
https://api.ovii.it.com/api/integrations/webhooks/whatsapp/

# Ensure HTTPS is configured
# Verify SSL certificate is valid
# Configure proper domain in ALLOWED_HOSTS
```

### Webhook Best Practices

1. **Always Return 200 OK**
   - Even if processing fails
   - Prevents Meta from retrying indefinitely
   - Log errors for later review

2. **Process Asynchronously**
   - Use Celery tasks for heavy processing
   - Keep webhook response time under 5 seconds
   - Queue messages for later processing

3. **Idempotent Processing**
   - Use message IDs to prevent duplicates
   - Store processed message IDs
   - Handle retry scenarios gracefully

4. **Comprehensive Logging**
   - Log all webhook events
   - Include message IDs and timestamps
   - Use structured logging for easier analysis

5. **Error Handling**
   - Catch and log all exceptions
   - Return 200 even on errors
   - Set up alerts for repeated failures

### Next Steps

After configuring the webhook:

1. **Test message delivery** - Send a template and verify webhook receives status updates
2. **Monitor webhook activity** - Check logs regularly for any issues
3. **Configure status tracking** - Update notification statuses based on webhook events
4. **Enable two-way messaging** - Implement logic to handle incoming user messages (optional)
5. **Set up alerts** - Monitor webhook failures and unusual patterns

For more information, see:
- [WhatsApp Webhook Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)
- [Deployment Commands](./DEPLOYMENT_COMMANDS.md)

## Security

### Best Practices

1. **Use database configuration in production**: Provides better access control and audit trail
2. **Rotate tokens regularly**: Generate new tokens every 60-90 days
3. **Use System User tokens**: For production, not temporary tokens
4. **Validate webhook signatures**: Verify incoming webhook authenticity
5. **Monitor unusual activity**: Set up alerts for high failure rates
6. **Restrict admin access**: Limit who can view/edit WhatsApp credentials

### Token Security

- **Database storage**: Credentials are stored securely in the database with Django's built-in protection
- **Environment variables**: If using `.env`, ensure the file is gitignored
- Use different tokens for development and production
- Restrict token permissions to minimum required
- Never log tokens in application logs
- Access tokens are write-only in the API (not exposed in GET responses)

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

### Version 1.1.0 (2024-12-10)
- **Added database configuration support**: WhatsApp credentials can now be stored in database
- **Runtime credential updates**: Change credentials without restarting the application
- **Admin interface**: Manage WhatsApp configurations through Django Admin
- **Backward compatibility**: Environment variables still work as fallback
- **Enhanced security**: Improved credential management and access control
- **Better audit trail**: Track when credentials are created and updated

### Version 1.0.0 (2024-12-09)
- Initial WhatsApp Cloud API integration
- Added OTP delivery via WhatsApp
- Implemented transaction notifications
- Created 6 message templates
- Added comprehensive tests
- Created management command for template sync
