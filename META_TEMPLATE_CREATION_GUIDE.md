# Meta WhatsApp Template Creation Guide

This guide provides step-by-step instructions for manually creating WhatsApp templates in Meta Business Manager when automated sync fails.

## Prerequisites

- Access to Meta Business Manager (business.facebook.com)
- WhatsApp Business Account (WABA) configured
- Admin permissions for the WhatsApp Business Account

---

## How to Create Templates Manually

### Step 1: Access Template Management

1. Go to [Meta Business Manager](https://business.facebook.com)
2. Navigate to **WhatsApp Manager**
3. Select your WhatsApp Business Account
4. Click on **Message Templates** in the left sidebar

### Step 2: Create New Template

1. Click the **"Create Template"** button
2. You'll be presented with a template creation form

---

## Template-Specific Instructions

### 1. OTP Verification Template

**Template Details:**
- **Name:** `otp_verification`
- **Category:** `Authentication`
- **Language:** `English (US)`

**Template Structure:**

**Body:**
```
Your Ovii verification code is {{1}}. This code expires in 5 minutes. Do not share this code with anyone.
```

**Buttons:**
- Add a **Copy Code** button (OTP type)
  - This button type is special for Authentication templates
  - It automatically creates a one-tap copy functionality

**Example Values:**
- Variable {{1}}: `123456`

**Important Notes:**
- ❌ **DO NOT** add a Footer (Authentication templates cannot have footers)
- ❌ **DO NOT** add a Header
- ✅ **DO** use the Copy Code button type for better UX

**Step-by-Step in Meta UI:**

1. **Category:** Select `Authentication`
2. **Name:** Enter `otp_verification`
3. **Language:** Select `English (US)` or `English`
4. **Body:** Paste the body text above
5. **Variables:** 
   - Click on the body text where you want a variable
   - Click "Add Variable" button or type `{{1}}`
   - Ensure you have exactly 1 variable in the body
6. **Buttons:**
   - Click "Add Button"
   - Select "Copy Code" button type
   - The button will automatically be configured for OTP use
7. **Examples:**
   - For variable {{1}}, enter: `123456`
8. **Submit:** Click "Submit" button

**Expected Result:**
- Status: `Pending` (approval usually takes 24-48 hours)
- Once approved: Status changes to `Approved`
- Template ID will be generated (you'll see it in the template list)

---

### 2. Transaction Received Template

**Template Details:**
- **Name:** `transaction_received`
- **Category:** `Marketing` or `Utility`
- **Language:** `English (US)`

**Template Structure:**

**Body:**
```
You have received {{1}} from {{2}}.

New balance: {{3}}

Transaction ID: {{4}}
```

**Footer:**
```
Ovii - Your Mobile Wallet
```

**Example Values:**
- Variable {{1}}: `10.00 USD`
- Variable {{2}}: `John Doe`
- Variable {{3}}: `110.00 USD`
- Variable {{4}}: `TXN123456`

**Step-by-Step in Meta UI:**

1. **Category:** Select `Marketing` or `Utility`
2. **Name:** Enter `transaction_received`
3. **Language:** Select `English (US)`
4. **Body:** Paste the body text above with 4 variables: {{1}}, {{2}}, {{3}}, {{4}}
5. **Footer:** Enter the footer text
6. **Examples:** Provide the example values for all 4 variables
7. **Submit:** Click "Submit"

---

### 3. Transaction Sent Template

**Template Details:**
- **Name:** `transaction_sent`
- **Category:** `Marketing` or `Utility`
- **Language:** `English (US)`

**Template Structure:**

**Body:**
```
You have sent {{1}} to {{2}}.

New balance: {{3}}

Transaction ID: {{4}}
```

**Footer:**
```
Ovii - Your Mobile Wallet
```

**Example Values:**
- Variable {{1}}: `10.00 USD`
- Variable {{2}}: `Jane Smith`
- Variable {{3}}: `90.00 USD`
- Variable {{4}}: `TXN123456`

---

### 4. Deposit Confirmed Template

**Template Details:**
- **Name:** `deposit_confirmed`
- **Category:** `Marketing` or `Utility`
- **Language:** `English (US)`

**Template Structure:**

**Body:**
```
Your deposit of {{1}} has been confirmed.

New balance: {{2}}

Transaction ID: {{3}}
```

**Footer:**
```
Ovii - Your Mobile Wallet
```

**Example Values:**
- Variable {{1}}: `50.00 USD`
- Variable {{2}}: `150.00 USD`
- Variable {{3}}: `TXN123456`

---

### 5. Withdrawal Processed Template

**Template Details:**
- **Name:** `withdrawal_processed`
- **Category:** `Marketing` or `Utility`
- **Language:** `English (US)`

**Template Structure:**

**Body:**
```
Your withdrawal of {{1}} has been processed successfully.

New balance: {{2}}

Transaction ID: {{3}}
```

**Footer:**
```
Ovii - Your Mobile Wallet
```

**Example Values:**
- Variable {{1}}: `25.00 USD`
- Variable {{2}}: `75.00 USD`
- Variable {{3}}: `TXN123456`

---

### 6. Payment Received Template

**Template Details:**
- **Name:** `payment_received`
- **Category:** `Marketing` or `Utility`
- **Language:** `English (US)`

**Template Structure:**

**Body:**
```
Payment received! 💰

You received {{1}} from {{2}}.

New balance: {{3}}

Transaction ID: {{4}}
```

**Footer:**
```
Ovii - Your Mobile Wallet
```

**Example Values:**
- Variable {{1}}: `25.00 USD`
- Variable {{2}}: `John Doe`
- Variable {{3}}: `525.00 USD`
- Variable {{4}}: `TXN123456`

---

### 7. Payment Sent Template

**Template Details:**
- **Name:** `payment_sent`
- **Category:** `Marketing` or `Utility`
- **Language:** `English (US)`

**Template Structure:**

**Body:**
```
Payment successful! ✅

You paid {{1}} to {{2}}.

New balance: {{3}}

Transaction ID: {{4}}
```

**Footer:**
```
Ovii - Your Mobile Wallet
```

**Example Values:**
- Variable {{1}}: `15.00 USD`
- Variable {{2}}: `ABC Store`
- Variable {{3}}: `85.00 USD`
- Variable {{4}}: `TXN123456`

---

## Important Rules & Best Practices

### Template Naming Rules
- Use lowercase letters, numbers, and underscores only
- No spaces or special characters
- Example: `otp_verification` ✅, `OTP Verification` ❌

### Category Guidelines

1. **AUTHENTICATION** (for OTP/Security codes)
   - ❌ Cannot have footers
   - ❌ Cannot have headers (usually)
   - ✅ Should use Copy Code button for OTP
   - ✅ Keep body text concise and security-focused

2. **MARKETING** (for promotional content)
   - ✅ Can have headers, body, footer, and buttons
   - ⚠️ Subject to stricter approval policies
   - ⚠️ May have sending limits

3. **UTILITY** (for transactional updates)
   - ✅ Can have headers, body, footer, and buttons
   - ✅ Better for transaction notifications
   - ✅ More lenient approval policies

### Variable Guidelines
- Use {{1}}, {{2}}, {{3}}, etc. for variables
- Always provide example values for ALL variables
- Example values should be realistic and match the expected format
- Number of variables in body must match number of example values

### Content Guidelines
- Keep messages clear and concise
- Avoid spammy language
- Include clear action items or information
- Use proper formatting (line breaks, emojis are allowed but use sparingly)

---

## Troubleshooting Common Errors

### "Template name already exists"
- **Solution:** The template already exists in Meta. Check the template list or use a different name.

### "Invalid parameter"
- **Cause:** Usually a formatting issue with variables or components
- **Check:**
  - Variable count matches example count
  - Variable format is correct ({{1}}, not {1} or {{variable_name}})
  - No missing required fields

### "Invalid template category for this component"
- **Cause:** Using incompatible components with template category
- **Example:** Adding footer to AUTHENTICATION template
- **Solution:** Remove the incompatible component

### Template Rejected After Submission
- **Review rejection reason** in Meta dashboard
- **Common reasons:**
  - Content violates WhatsApp policies
  - Variables used incorrectly
  - Missing information or unclear purpose
  - Spammy or promotional language in wrong category

---

## After Creating Templates

### Check Template Status

Run this command to sync template IDs and statuses to your database:

```bash
docker compose exec backend python manage.py sync_whatsapp_templates --check-status
```

### Verify Templates are Approved

Templates must be approved by Meta before use. This typically takes:
- **Authentication templates:** 24-48 hours
- **Marketing templates:** 48-72 hours
- **Utility templates:** 24-48 hours

Check approval status in:
1. Meta Business Manager > WhatsApp Manager > Message Templates
2. Or run: `docker compose exec backend python manage.py sync_whatsapp_templates --check-status --verbose`

---

## Need Help?

If you encounter issues:

1. **Check Meta's documentation:** [WhatsApp Business Platform - Message Templates](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates)

2. **Review template policies:** [WhatsApp Business Policy](https://www.whatsapp.com/legal/business-policy)

3. **Contact Meta Support:** Available in your WhatsApp Business Account dashboard

4. **Check our troubleshooting guide:** `WHATSAPP_TROUBLESHOOTING.md`

---

## Quick Copy-Paste Template Summary

For quick reference when creating in Meta UI:

### OTP Verification
```
Category: Authentication
Name: otp_verification
Body: Your Ovii verification code is {{1}}. This code expires in 5 minutes. Do not share this code with anyone.
Button: Copy Code (OTP type)
Example: 123456
Footer: None
```

### Transaction Templates (received/sent)
```
Category: Utility
Body: [Include 4 variables: amount, name, balance, transaction_id]
Footer: Ovii - Your Mobile Wallet
Examples: 10.00 USD, John Doe, 110.00 USD, TXN123456
```

---

**Last Updated:** 2024-12-17
**Author:** Moreblessing Nyemba
**Copyright:** © 2025 Ovii. All Rights Reserved.
