# WhatsApp Template Migration Guide

## Overview

This guide explains the changes made to WhatsApp message templates to fix Meta API validation errors and provides instructions for updating your code.

## What Changed?

### Problem: Duplicate Variables

Meta's WhatsApp Business API rejects templates with duplicate variable names. Previously, several templates had "currency" appearing twice in the variables list, which caused 400 Bad Request errors during template sync.

**Example of the problem:**
```python
# OLD - INCORRECT ❌
"variables": [
    "amount",
    "currency",      # First occurrence
    "sender_name",
    "new_balance",
    "currency",      # Duplicate! Meta rejects this
]
```

### Solution: Combined Variables

We combined related values into single variables to avoid duplicates:

```python
# NEW - CORRECT ✅
"variables": [
    "amount_with_currency",      # e.g., "10.00 USD"
    "sender_name",
    "new_balance_with_currency",  # e.g., "110.00 USD"
]
```

## Affected Templates

The following templates have been updated:

1. ✅ **transaction_received** - Money received notification
2. ✅ **transaction_sent** - Money sent notification
3. ✅ **deposit_confirmed** - Deposit confirmation
4. ✅ **withdrawal_processed** - Withdrawal confirmation
5. ✅ **payment_received** - Merchant payment received
6. ✅ **payment_sent** - Customer payment to merchant
7. ✅ **referral_bonus_credited** - Referral bonus notification

## Template-Specific Changes

### 1. transaction_received

**Before:**
```python
variables = {
    "amount": "10.00",
    "currency": "USD",
    "sender_name": "John Doe",
    "new_balance": "110.00",
    "currency": "USD",  # Duplicate!
    "transaction_id": "TXN123456"
}
```

**After:**
```python
variables = {
    "amount_with_currency": "10.00 USD",  # Combined
    "sender_name": "John Doe",
    "new_balance_with_currency": "110.00 USD",  # Combined
    "transaction_id": "TXN123456"
}
```

**Template body changed from:**
```
You have received {{1}} {{2}} from {{3}}.
New balance: {{4}} {{5}}
Transaction ID: {{6}}
```

**To:**
```
You have received {{1}} from {{2}}.
New balance: {{3}}
Transaction ID: {{4}}
```

### 2. transaction_sent

**Before:**
```python
variables = {
    "amount": "10.00",
    "currency": "USD",
    "recipient_name": "Jane Smith",
    "new_balance": "90.00",
    "currency": "USD",  # Duplicate!
    "transaction_id": "TXN123456"
}
```

**After:**
```python
variables = {
    "amount_with_currency": "10.00 USD",  # Combined
    "recipient_name": "Jane Smith",
    "new_balance_with_currency": "90.00 USD",  # Combined
    "transaction_id": "TXN123456"
}
```

### 3. deposit_confirmed

**Before:**
```python
variables = {
    "amount": "50.00",
    "currency": "USD",
    "new_balance": "150.00",
    "currency": "USD",  # Duplicate!
    "transaction_id": "TXN123456"
}
```

**After:**
```python
variables = {
    "amount_with_currency": "50.00 USD",  # Combined
    "new_balance_with_currency": "150.00 USD",  # Combined
    "transaction_id": "TXN123456"
}
```

### 4. withdrawal_processed

**Before:**
```python
variables = {
    "amount": "25.00",
    "currency": "USD",
    "new_balance": "75.00",
    "currency": "USD",  # Duplicate!
    "transaction_id": "TXN123456"
}
```

**After:**
```python
variables = {
    "amount_with_currency": "25.00 USD",  # Combined
    "new_balance_with_currency": "75.00 USD",  # Combined
    "transaction_id": "TXN123456"
}
```

### 5. payment_received

**Before:**
```python
variables = {
    "amount": "25.00",
    "currency": "USD",
    "customer_name": "John Doe",
    "new_balance": "525.00",
    "currency": "USD",  # Duplicate!
    "transaction_id": "TXN123456"
}
```

**After:**
```python
variables = {
    "amount_with_currency": "25.00 USD",  # Combined
    "customer_name": "John Doe",
    "new_balance_with_currency": "525.00 USD",  # Combined
    "transaction_id": "TXN123456"
}
```

### 6. payment_sent

**Before:**
```python
variables = {
    "amount": "15.00",
    "currency": "USD",
    "merchant_name": "ABC Store",
    "new_balance": "85.00",
    "currency": "USD",  # Duplicate!
    "transaction_id": "TXN123456"
}
```

**After:**
```python
variables = {
    "amount_with_currency": "15.00 USD",  # Combined
    "merchant_name": "ABC Store",
    "new_balance_with_currency": "85.00 USD",  # Combined
    "transaction_id": "TXN123456"
}
```

### 7. referral_bonus_credited

**Before:**
```python
variables = {
    "bonus_amount": "5.00",
    "currency": "USD",
    "new_balance": "105.00",
    "currency": "USD"  # Duplicate!
}
```

**After:**
```python
variables = {
    "bonus_amount_with_currency": "5.00 USD",  # Combined
    "new_balance_with_currency": "105.00 USD"  # Combined
}
```

## How to Update Your Code

### Step 1: Identify Code Using WhatsApp Templates

Search for code that calls `send_whatsapp_template` or uses `format_template_components`:

```bash
grep -r "send_whatsapp_template" . --include="*.py"
grep -r "format_template_components" . --include="*.py"
```

### Step 2: Update Variable Preparation

**Example: Updating transaction notification code**

**Before:**
```python
from notifications.services import send_whatsapp_template
from decimal import Decimal

amount = Decimal("10.00")
currency = "USD"
new_balance = Decimal("110.00")

# OLD WAY ❌
variables = {
    "amount": str(amount),
    "currency": currency,
    "sender_name": sender.full_name,
    "new_balance": str(new_balance),
    "currency": currency,  # This was causing errors!
    "transaction_id": transaction.id
}

send_whatsapp_template(
    phone_number=recipient.phone_number,
    template_name="transaction_received",
    variables=variables
)
```

**After:**
```python
from notifications.services import send_whatsapp_template
from decimal import Decimal

amount = Decimal("10.00")
currency = "USD"
new_balance = Decimal("110.00")

# NEW WAY ✅
variables = {
    "amount_with_currency": f"{amount} {currency}",  # Combined
    "sender_name": sender.full_name,
    "new_balance_with_currency": f"{new_balance} {currency}",  # Combined
    "transaction_id": transaction.id
}

send_whatsapp_template(
    phone_number=recipient.phone_number,
    template_name="transaction_received",
    variables=variables
)
```

### Step 3: Create Helper Functions (Recommended)

To make updates easier and maintain consistency, create helper functions:

```python
# utils.py or similar
def format_amount_with_currency(amount, currency="USD"):
    """Format amount with currency for WhatsApp templates."""
    from decimal import Decimal
    
    if isinstance(amount, (int, float)):
        amount = Decimal(str(amount))
    
    return f"{amount:.2f} {currency}"


# Usage in your code
variables = {
    "amount_with_currency": format_amount_with_currency(amount, currency),
    "new_balance_with_currency": format_amount_with_currency(new_balance, currency),
    "sender_name": sender.full_name,
    "transaction_id": transaction.id
}
```

### Step 4: Update Tests

Don't forget to update your tests:

**Before:**
```python
def test_send_transaction_notification(self):
    variables = {
        "amount": "10.00",
        "currency": "USD",
        "sender_name": "John",
        "new_balance": "110.00",
        "currency": "USD",
        "transaction_id": "TXN123"
    }
    # ... rest of test
```

**After:**
```python
def test_send_transaction_notification(self):
    variables = {
        "amount_with_currency": "10.00 USD",
        "sender_name": "John",
        "new_balance_with_currency": "110.00 USD",
        "transaction_id": "TXN123"
    }
    # ... rest of test
```

## Testing Your Changes

### 1. Verify Template Definitions

```bash
docker compose exec backend python manage.py sync_whatsapp_templates --display-only
```

### 2. Sync Templates to Meta

```bash
docker compose exec backend python manage.py sync_whatsapp_templates
```

This should now succeed for all templates without 400 errors.

### 3. Test Sending Messages

```bash
docker compose exec backend python manage.py shell
```

```python
from notifications.services import send_whatsapp_template

# Test transaction_received template
variables = {
    "amount_with_currency": "10.00 USD",
    "sender_name": "Test User",
    "new_balance_with_currency": "110.00 USD",
    "transaction_id": "TEST123456"
}

send_whatsapp_template(
    phone_number="+263777123456",  # Use your test number
    template_name="transaction_received",
    variables=variables
)
```

## Common Mistakes to Avoid

### ❌ Don't separate amount and currency

```python
# WRONG
variables = {
    "amount": "10.00",
    "currency": "USD",
}
```

### ✅ Always combine them

```python
# CORRECT
variables = {
    "amount_with_currency": "10.00 USD",
}
```

### ❌ Don't hardcode spaces inconsistently

```python
# INCONSISTENT
"amount_with_currency": f"{amount}{currency}"  # Missing space
"new_balance_with_currency": f"{balance} {currency}"  # Has space
```

### ✅ Use consistent formatting

```python
# CONSISTENT
"amount_with_currency": f"{amount} {currency}"
"new_balance_with_currency": f"{balance} {currency}"
```

### ❌ Don't forget to update both amount fields

```python
# INCOMPLETE
variables = {
    "amount_with_currency": "10.00 USD",  # Updated
    "sender_name": "John",
    "new_balance": "110.00",  # WRONG - still separate!
    "currency": "USD",
}
```

### ✅ Update all currency-related fields

```python
# COMPLETE
variables = {
    "amount_with_currency": "10.00 USD",  # Updated
    "sender_name": "John",
    "new_balance_with_currency": "110.00 USD",  # Updated
}
```

## Rollout Strategy

### Phase 1: Update Template Definitions (Done)

- ✅ Updated template definitions in `whatsapp_templates.py`
- ✅ Fixed duplicate variable issue
- ✅ Updated template bodies

### Phase 2: Sync Templates to Meta

```bash
# Delete old rejected templates in Meta (optional, or Meta will handle it)
# Then sync new templates
docker compose exec backend python manage.py sync_whatsapp_templates
```

### Phase 3: Update Application Code

1. Search for all template usage
2. Update variable preparation
3. Test locally
4. Deploy to staging
5. Test in staging
6. Deploy to production

### Phase 4: Monitor

- Check logs for WhatsApp sending errors
- Monitor Meta template approval status
- Verify users receive notifications correctly

## Backward Compatibility

**Important**: The old template format will NOT work once new templates are synced to Meta. You must update all code that sends these templates before or immediately after syncing.

## Need Help?

If you encounter issues:

1. Check the [Full Commands Reference](./FULL_COMMANDS_REFERENCE.md)
2. Review [WhatsApp Integration Guide](./WHATSAPP_INTEGRATION.md)
3. Check application logs: `docker compose logs -f backend`
4. Test template sync: `docker compose exec backend python manage.py sync_whatsapp_templates`

## Related Documentation

- [Full Commands Reference](./FULL_COMMANDS_REFERENCE.md)
- [WhatsApp Integration Guide](./WHATSAPP_INTEGRATION.md)
- [Webhook Setup Guide](./WEBHOOK_SETUP_GUIDE.md)
- [WhatsApp Template Troubleshooting](./WHATSAPP_TEMPLATE_TROUBLESHOOTING.md)

---

**Last Updated**: December 17, 2024
**Version**: 1.0.0
