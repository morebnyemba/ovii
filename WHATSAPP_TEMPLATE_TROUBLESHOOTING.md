# WhatsApp Template Sync Issues - Troubleshooting Guide

## Overview

When syncing WhatsApp templates to Meta, some templates may fail with 400 Bad Request errors. This document explains common causes and solutions.

## Failed Templates Analysis

Based on the sync output, the following templates **failed**:

1. ❌ `otp_verification` - OTP verification template
2. ❌ `transaction_received` - Money received notification
3. ❌ `transaction_sent` - Money sent notification
4. ❌ `deposit_confirmed` - Deposit confirmation
5. ❌ `withdrawal_processed` - Withdrawal confirmation
6. ❌ `payment_received` - Merchant payment received
7. ❌ `payment_sent` - Customer payment to merchant

The following templates **succeeded**:

1. ✅ `welcome_message` - Welcome new users
2. ✅ `transaction_failed` - Transaction failure notification
3. ✅ `deposit_failed` - Deposit failure notification
4. ✅ `withdrawal_failed` - Withdrawal failure notification
5. ✅ `kyc_approved` - KYC approval notification
6. ✅ `kyc_rejected` - KYC rejection notification
7. ✅ `referral_bonus_credited` - Referral bonus notification

## Root Cause Analysis

### Issue 1: Duplicate Variable Names

**Problem**: Several failed templates have the same variable appearing multiple times:

```python
"transaction_received": {
    "variables": [
        "amount",
        "currency",      # First occurrence
        "sender_name",
        "new_balance",
        "currency",      # Second occurrence - DUPLICATE!
        "transaction_id",
    ],
}
```

**Why This Fails**: Meta's WhatsApp Business API requires each variable placeholder to be unique within a template. When you have `{{1}}`, `{{2}}`, `{{3}}`, etc., each number must map to a unique variable.

**Templates Affected**:
- `transaction_received` - currency appears twice
- `transaction_sent` - currency appears twice
- `deposit_confirmed` - currency appears twice
- `withdrawal_processed` - currency appears twice
- `payment_received` - currency appears twice
- `payment_sent` - currency appears twice

### Issue 2: Authentication Category Restrictions

**Problem**: The `otp_verification` template uses the AUTHENTICATION category.

**Restrictions**:
- AUTHENTICATION templates have stricter requirements
- Must follow specific format guidelines
- May require additional approval steps
- Limited to specific use cases (OTP, password reset, etc.)

**Meta's Requirements for AUTHENTICATION Templates**:
1. Must be for authentication purposes only
2. Should include the OTP code clearly
3. Should have expiration information
4. Footer is optional but recommended
5. No marketing content allowed

## Solutions

### Solution 1: Fix Duplicate Variables

We need to modify templates to avoid duplicate variable names. There are two approaches:

#### Approach A: Combine Duplicate Values (Recommended)

Instead of sending currency twice, combine amount with currency:

```python
"transaction_received": {
    "body": "You have received {{1}} from {{2}}.\n\nNew balance: {{3}}\n\nTransaction ID: {{4}}",
    "variables": [
        "amount_with_currency",  # e.g., "10.00 USD"
        "sender_name",
        "new_balance_with_currency",  # e.g., "110.00 USD"
        "transaction_id",
    ],
}
```

#### Approach B: Use Currency Symbol Once

Show currency once at the beginning or use symbols:

```python
"transaction_received": {
    "body": "You have received ${{1}} from {{2}}.\n\nNew balance: ${{3}}\n\nTransaction ID: {{4}}",
    "variables": [
        "amount",           # e.g., "10.00"
        "sender_name",
        "new_balance",      # e.g., "110.00"
        "transaction_id",
    ],
}
```

### Solution 2: Simplify OTP Template

For the `otp_verification` template, ensure it meets AUTHENTICATION requirements:

```python
"otp_verification": {
    "category": "AUTHENTICATION",
    "body": "Your Ovii verification code is {{1}}. This code expires in 5 minutes. Do not share this code with anyone.",
    "footer": "Ovii - Your Mobile Wallet",
    "variables": ["code"],
    "example": {"body_text": [["123456"]]},
}
```

**Note**: Ensure the OTP is clearly visible and not buried in text.

## Implementation Steps

### Step 1: Update Template Definitions

Modify `/home/runner/work/ovii/ovii/ovii_backend/integrations/whatsapp_templates.py`:

1. Remove duplicate variables from templates
2. Update template bodies to reflect new variable structure
3. Update example values accordingly

### Step 2: Update Code That Sends Templates

Modify functions that send templates to pass combined values:

**Before**:
```python
send_whatsapp_template(
    phone_number=user.phone_number,
    template_name="transaction_received",
    variables={
        "amount": "10.00",
        "currency": "USD",
        "sender_name": "John Doe",
        "new_balance": "110.00",
        "currency": "USD",  # Duplicate!
        "transaction_id": "TXN123",
    }
)
```

**After**:
```python
send_whatsapp_template(
    phone_number=user.phone_number,
    template_name="transaction_received",
    variables={
        "amount_with_currency": f"{amount} {currency}",  # Combined
        "sender_name": "John Doe",
        "new_balance_with_currency": f"{new_balance} {currency}",  # Combined
        "transaction_id": "TXN123",
    }
)
```

### Step 3: Re-sync Templates

After updating templates:

```bash
# Delete old failed templates from Meta (if they exist)
# This is done in Meta Business Manager > Message Templates

# Re-sync updated templates
docker compose exec backend python manage.py sync_whatsapp_templates

# Check status
docker compose exec backend python manage.py sync_whatsapp_templates --check-status
```

## Alternative: Manual Template Creation

If automatic sync continues to fail, create templates manually in Meta Business Manager:

### Step 1: Access Meta Business Manager

1. Go to https://business.facebook.com/wa/manage/message-templates/
2. Click **"Create Template"**

### Step 2: Create Each Template

For `transaction_received`:

- **Template Name**: `transaction_received`
- **Category**: Select "TRANSACTIONAL" or "UTILITY" (not MARKETING)
- **Language**: English (US)
- **Header**: None
- **Body**:
  ```
  You have received {{1}} from {{2}}.
  
  New balance: {{3}}
  
  Transaction ID: {{4}}
  ```
- **Footer**: `Ovii - Your Mobile Wallet`
- **Buttons**: None
- **Sample Content**:
  - {{1}}: `10.00 USD`
  - {{2}}: `John Doe`
  - {{3}}: `110.00 USD`
  - {{4}}: `TXN123456`

### Step 3: Submit for Approval

- Click **"Submit"**
- Wait 24-48 hours for Meta approval
- Check status in Message Templates dashboard

## Best Practices

### Template Design

1. **Keep it Simple**: Fewer variables = less chance of errors
2. **Unique Variables**: Never repeat the same variable name
3. **Clear Examples**: Provide realistic example values
4. **Appropriate Category**:
   - AUTHENTICATION: OTP, password reset only
   - UTILITY/TRANSACTIONAL: Transaction notifications
   - MARKETING: Promotional messages

### Testing

1. **Test in Sandbox First**: Use Meta's test environment
2. **Validate Format**: Ensure variables match template body
3. **Check Examples**: All variable placeholders should have examples

### Monitoring

```bash
# Check template sync status regularly
docker compose exec backend python manage.py sync_whatsapp_templates --check-status

# View template approval status in Meta Business Manager
# https://business.facebook.com/wa/manage/message-templates/

# Monitor sync logs
docker compose logs backend | grep -i "template"
```

## Common Error Messages

### "Invalid Parameter"

**Cause**: Variable mismatch or duplicate variables

**Solution**: Review template definition and ensure:
- All variables are unique
- Variable count matches placeholders in body
- Example values are provided for all variables

### "Template Already Exists"

**Cause**: Template with same name already exists in Meta

**Solution**:
1. Check Meta Business Manager for existing template
2. Either use existing template or delete and recreate
3. Update local database to match Meta state

### "Category Mismatch"

**Cause**: Template content doesn't match selected category

**Solution**:
- AUTHENTICATION: Only for security codes
- UTILITY: For transactional notifications
- MARKETING: For promotional content

## Getting More Details

To see the exact error from Meta's API:

```bash
# Run sync with verbose logging
docker compose exec backend python manage.py shell

>>> from integrations.services import WhatsAppClient
>>> from integrations.whatsapp_templates import convert_template_to_meta_format
>>> 
>>> client = WhatsAppClient()
>>> template_data = convert_template_to_meta_format("transaction_received")
>>> print(template_data)
>>> 
>>> # Try to create template manually and see error
>>> import requests
>>> url = f"https://graph.facebook.com/v18.0/{client.waba_id}/message_templates"
>>> headers = {"Authorization": f"Bearer {client.access_token}"}
>>> response = requests.post(url, json=template_data, headers=headers)
>>> print(response.status_code)
>>> print(response.json())
```

## Next Steps

1. **Update Templates**: Fix duplicate variables in `whatsapp_templates.py`
2. **Update Senders**: Modify code that calls templates to match new format
3. **Re-sync**: Run sync command again
4. **Monitor**: Check approval status after 24-48 hours
5. **Test**: Send test messages with approved templates

## Support Resources

- [WhatsApp Template Guidelines](https://developers.facebook.com/docs/whatsapp/message-templates/guidelines)
- [Template Components Reference](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages#template-object)
- [Meta Business Support](https://business.facebook.com/business/help)

---

**Note**: Template approval can take 24-48 hours. Ensure templates follow Meta's guidelines to avoid rejection.
