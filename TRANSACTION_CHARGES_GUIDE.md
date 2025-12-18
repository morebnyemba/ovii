# Transaction Charges Configuration Guide

This guide explains how to configure transaction charges for different types of transactions and user roles in the Ovii platform.

## Overview

Transaction charges in Ovii are flexible and can be configured per transaction type and user role. Charges can be:
- **Percentage-based**: A percentage of the transaction amount
- **Fixed**: A flat fee regardless of amount
- Applied to either the **sender** or **receiver**

## Configuration via Django Admin

Transaction charges are managed through the Django admin interface:

1. Log in to the Django admin panel at `/admin`
2. Navigate to **Wallets** → **Transaction Charges**
3. Click **Add Transaction Charge** to create a new charge rule

## Charge Properties

### 1. Name
Format: `{transaction_type}_{user_role}`

Examples:
- `transfer_customer` - For customer-to-customer transfers
- `payment_merchant` - For payments to merchants
- `withdrawal_agent` - For agent cash-out transactions
- `deposit_customer` - For customer deposits

### 2. Charge Type
- **PERCENTAGE**: Charge is calculated as a percentage of transaction amount
- **FIXED**: Charge is a flat amount

### 3. Value
- For **PERCENTAGE**: Enter the percentage (e.g., `2.5` for 2.5%)
- For **FIXED**: Enter the fixed amount (e.g., `0.50` for $0.50)

### 4. Applies To
- **SENDER**: The sender pays the charge (deducted from their wallet)
- **RECEIVER**: The receiver pays the charge (deducted from amount received)

### 5. Minimum Charge
The minimum charge amount that will be applied, even if the calculated charge is lower.

### 6. Maximum Charge
The maximum charge amount that will be applied, even if the calculated charge is higher. (Optional)

### 7. Is Active
Toggle to enable/disable the charge without deleting it.

## Examples

### Example 1: Customer Transfer Fee (Percentage)
```
Name: transfer_customer
Charge Type: PERCENTAGE
Value: 1.5
Applies To: SENDER
Minimum Charge: 0.10
Maximum Charge: 5.00
Is Active: Yes
```
Result: Customers pay 1.5% of transfer amount, minimum $0.10, maximum $5.00

### Example 2: Merchant Payment Fee (Fixed)
```
Name: payment_merchant
Charge Type: FIXED
Value: 0.25
Applies To: SENDER
Minimum Charge: 0.25
Maximum Charge: (empty)
Is Active: Yes
```
Result: Customers pay a flat $0.25 fee when paying merchants

### Example 3: Cash-Out Fee (Percentage with Cap)
```
Name: withdrawal_customer
Charge Type: PERCENTAGE
Value: 2.0
Applies To: SENDER
Minimum Charge: 0.50
Maximum Charge: 10.00
Is Active: Yes
```
Result: Customers pay 2% for cash-outs, minimum $0.50, capped at $10.00

## Transaction Types

The following transaction types are available:
- **TRANSFER**: Peer-to-peer money transfers
- **PAYMENT**: Payments to merchants
- **WITHDRAWAL**: Cash-out transactions through agents
- **DEPOSIT**: Cash-in/deposit transactions
- **COMMISSION**: Commission payments

## User Roles

User roles that can be used in charge names:
- **customer**: Regular users
- **merchant**: Merchant accounts
- **agent**: Agent accounts

## How Charges Are Applied

1. When a transaction is initiated, the system looks for an active charge rule matching the transaction type and user role
2. The charge is calculated based on the charge type (percentage or fixed)
3. The calculated charge is clamped between the minimum and maximum limits
4. The charge is deducted from the appropriate party (sender or receiver)
5. All charges are collected in the system's Fee Wallet

## Charge Calculation Logic

```python
if charge_type == PERCENTAGE:
    charge_amount = (value / 100) * transaction_amount
else:  # FIXED
    charge_amount = value

# Apply limits
charge_amount = max(charge_amount, min_charge)
if max_charge is not None:
    charge_amount = min(charge_amount, max_charge)
```

## Best Practices

1. **Test charges thoroughly**: Create test charges with small amounts first
2. **Monitor fee collection**: Regularly check the system's Fee Wallet
3. **Communicate clearly**: Inform users about applicable charges before they transact
4. **Use reasonable limits**: Set minimum and maximum charges that make sense for your business
5. **Review regularly**: Periodically review and adjust charges based on business needs

## API Integration

The frontend can query transaction charges using the `/api/wallets/transaction-charge/` endpoint:

```
GET /api/wallets/transaction-charge/?transaction_type=TRANSFER&amount=100.00
```

Response:
```json
{
  "charge_amount": "1.50"
}
```

This allows the UI to show users the charge before they confirm a transaction.

## Notes

- If no matching charge rule is found, the transaction proceeds with zero charges
- Multiple charge rules can exist for different transaction types and user roles
- Inactive charges are ignored by the system
- Changes to charge rules take effect immediately for new transactions
- Historical transactions retain their original charge amounts even if rules change

## Support

For questions or issues with transaction charges, contact the Ovii development team.

---

**Author**: Moreblessing Nyemba  
**Copyright**: © 2025 Ovii. All Rights Reserved.
