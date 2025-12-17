# WhatsApp Webhook Setup Guide for Ovii

This guide provides step-by-step instructions for configuring WhatsApp Cloud API webhooks for the Ovii platform.

## Prerequisites

Before setting up webhooks, ensure you have:

1. **WhatsApp Business Account (WABA)** set up in Meta Business Manager
2. **Access to Meta for Developers** console
3. **Production domain** with HTTPS enabled (required by Meta)
4. **WhatsApp credentials** configured in your `.env` file

## Environment Variables

Ensure these variables are set in your `.env` file:

```bash
# WhatsApp Business Account ID (from Meta Business Manager)
WHATSAPP_WABA_ID=your_waba_id_here

# Phone Number ID (from WhatsApp API Settings)
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here

# Access Token (from Meta for Developers)
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token_here

# API Version (e.g., v18.0, v19.0, v20.0, v24.0)
WHATSAPP_API_VERSION=v24.0

# Webhook Verify Token (create a random secure string)
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_secure_random_token_here
```

### Generating a Webhook Verify Token

Create a secure random token for webhook verification:

```bash
# Generate a secure random token
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the generated token and set it as `WHATSAPP_WEBHOOK_VERIFY_TOKEN` in your `.env` file.

## Webhook Endpoint

The WhatsApp webhook endpoint in Ovii is:

```
https://your-domain.com/api/integrations/webhooks/whatsapp/
```

For example, if your domain is `api.ovii.it.com`:
```
https://api.ovii.it.com/api/integrations/webhooks/whatsapp/
```

## Configuring Webhooks in Meta

### Step 1: Access WhatsApp API Settings

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Select your app
3. Navigate to **WhatsApp** → **Configuration**

### Step 2: Configure Webhook

1. In the **Webhook** section, click **Edit**
2. Enter your webhook details:
   - **Callback URL**: `https://api.ovii.it.com/api/integrations/webhooks/whatsapp/`
   - **Verify Token**: The token you set in `WHATSAPP_WEBHOOK_VERIFY_TOKEN`

3. Click **Verify and Save**

Meta will make a GET request to your webhook endpoint to verify it. The endpoint will:
- Check that `hub.mode` equals "subscribe"
- Verify the token matches your `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- Return the `hub.challenge` value to confirm verification

### Step 3: Subscribe to Webhook Fields

After verification, subscribe to these webhook fields:

1. **messages** - Receive incoming messages from users
2. **message_status** - Get delivery and read receipts for sent messages

Click **Subscribe** for each field you want to receive notifications for.

### Step 4: Test the Webhook

Test that your webhook is working:

1. Send a test WhatsApp template message using the sync command
2. Check your application logs for webhook notifications
3. Verify that status updates (sent, delivered, read) are being received

## Webhook Security

The webhook endpoint implements several security measures:

1. **Token Verification**: Uses constant-time comparison to prevent timing attacks
2. **Public Access**: The endpoint is publicly accessible (required by Meta)
3. **Signature Validation**: (Recommended) Implement X-Hub-Signature validation for additional security

### Optional: Enhanced Security with Signature Validation

For production environments, consider implementing webhook signature validation:

```python
import hashlib
import hmac

def verify_webhook_signature(request, app_secret):
    """
    Verify the X-Hub-Signature-256 header from Meta webhooks.
    """
    signature = request.headers.get('X-Hub-Signature-256', '')
    
    if not signature:
        return False
    
    # Remove 'sha256=' prefix
    expected_signature = signature.replace('sha256=', '')
    
    # Compute the signature
    body = request.body
    computed_signature = hmac.new(
        app_secret.encode('utf-8'),
        body,
        hashlib.sha256
    ).hexdigest()
    
    # Compare using constant-time comparison
    return hmac.compare_digest(computed_signature, expected_signature)
```

## Troubleshooting

### Webhook Verification Failed

**Error**: "Verification failed" when setting up webhook

**Solutions**:
1. Check that `WHATSAPP_WEBHOOK_VERIFY_TOKEN` is set correctly in `.env`
2. Ensure the verify token in Meta matches exactly (case-sensitive)
3. Verify your Django application is running and accessible via HTTPS
4. Check application logs for detailed error messages

### Webhook Not Receiving Messages

**Error**: Webhook endpoint is verified but not receiving notifications

**Solutions**:
1. Verify you've subscribed to webhook fields in Meta console
2. Check that your WhatsApp Business Account is properly configured
3. Ensure your callback URL is correct and accessible
4. Review Meta's webhook delivery logs in the developer console
5. Check application logs for any errors processing webhooks

### SSL Certificate Errors

**Error**: Meta can't reach your webhook due to SSL issues

**Solutions**:
1. Ensure your domain has a valid SSL certificate
2. Use Let's Encrypt or a commercial certificate authority
3. Test your SSL configuration at [SSL Labs](https://www.ssllabs.com/ssltest/)
4. Verify your Nginx/proxy is properly configured for HTTPS

### Environment Variables Not Loading

**Error**: Webhook verify token not found

**Solutions**:
1. Verify `.env` file is in the correct location
2. Restart your Docker containers: `docker compose restart backend`
3. Check that `python-dotenv` is properly configured in `settings.py`
4. Verify environment variables are loaded: `docker compose exec backend env | grep WHATSAPP`

## Monitoring Webhooks

### Check Webhook Logs

View webhook activity in your application logs:

```bash
# View all logs
docker compose logs -f backend

# Filter WhatsApp webhook logs
docker compose logs -f backend | grep -i whatsapp

# View recent webhook activity
docker compose logs --tail=100 backend | grep -i webhook
```

### Meta Webhook Logs

Check webhook delivery status in Meta:

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Select your app
3. Navigate to **WhatsApp** → **Webhooks**
4. Click **View Logs** to see delivery attempts and responses

## Database Configuration (Optional)

Store WhatsApp configuration in the database instead of environment variables:

```python
# In Django admin or shell
from integrations.models import WhatsAppConfig

config = WhatsAppConfig.objects.create(
    waba_id="your_waba_id",
    phone_number_id="your_phone_number_id",
    access_token="your_access_token",
    webhook_verify_token="your_verify_token",
    is_active=True
)
```

The webhook endpoint will prioritize database configuration over environment variables.

## Next Steps

After configuring webhooks:

1. **Sync WhatsApp Templates**: Run `python manage.py sync_whatsapp_templates`
2. **Test Notifications**: Send test messages to verify webhook integration
3. **Monitor Logs**: Keep an eye on logs for any delivery issues
4. **Implement Message Handling**: Customize `_handle_incoming_message()` for two-way messaging

## Related Documentation

- [WhatsApp Cloud API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Webhook Components](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components)
- [Message Templates](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates)
- [Ovii WhatsApp Integration Guide](./WHATSAPP_INTEGRATION.md)

## Support

For issues or questions:
- Check application logs: `docker compose logs -f backend`
- Review Meta webhook logs in developer console
- Contact Ovii support: support@ovii.it.com
