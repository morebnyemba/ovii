# Ovii - Agent Context & Guidelines

> This file provides additional context, architectural decisions, and coding standards for AI agents working on the Ovii project.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture & Design Principles](#architecture--design-principles)
- [Data Flow & Business Logic](#data-flow--business-logic)
- [Coding Standards & Conventions](#coding-standards--conventions)
- [Security Guidelines](#security-guidelines)
- [Testing Strategy](#testing-strategy)
- [Common Patterns & Practices](#common-patterns--practices)
- [Troubleshooting & Debugging](#troubleshooting--debugging)

---

## Project Overview

**Ovii** is a fintech wallet and payment gateway platform operating primarily in Zimbabwe. The project is mission-critical financial software that handles real money transactions, requiring the highest standards of security, reliability, and accuracy.

### Core Mission
"People don't need banks; they need flow." - Provide seamless, mobile-first financial services for creators, freelancers, vendors, and everyday users.

### Project Maturity
- **Phase 1 (MVP)**: ✅ Complete - All core wallet operations functional
- **Phase 2 (Growth)**: 🟡 85% Complete - KYC, referrals, merchant/agent systems operational
- **Phase 3 (Scale)**: 🔜 10% Complete - Foundation laid for expansion

---

## Architecture & Design Principles

### Monorepo Structure
```
ovii/
├── ovii_backend/          # Django REST API (Python 3.11+)
│   ├── core/              # Shared utilities and base models
│   ├── users/             # User authentication and profiles
│   ├── wallets/           # Wallet and transaction logic
│   ├── merchants/         # Merchant accounts and API keys
│   ├── agents/            # Agent system with commissions
│   ├── integrations/      # Payment gateway integrations (EcoCash, Paynow)
│   ├── notifications/     # Real-time notifications (WebSocket + WhatsApp)
│   └── transactions/      # Transaction processing and history
└── ovii-frontend/         # Next.js web app (React + Tailwind CSS)
    ├── src/app/           # Next.js 14+ App Router
    ├── src/components/    # Reusable React components
    └── src/lib/           # Utility functions and API clients
```

### Key Design Principles

1. **Security First**: This is financial software - always validate, always authenticate, always audit
2. **Mobile-First**: Design for mobile users, optimize for slow connections
3. **Idempotency**: All financial operations must be idempotent to prevent duplicate charges
4. **Audit Trail**: Every financial transaction must be logged with timestamps and user context
5. **Separation of Concerns**: Keep authentication, authorization, and business logic separate
6. **Progressive Enhancement**: Start with core functionality, add features incrementally

---

## Data Flow & Business Logic

### Authentication Flow
1. **User Registration**: Phone number → OTP generation → OTP verification → Account activation → Wallet creation
2. **User Login**: Phone number → OTP generation → OTP verification → JWT token issuance
3. **Transaction Authorization**: Requires separate Transaction PIN (6-digit numeric)

**Important**: Regular users do NOT have passwords. Only admin/staff users use password-based authentication.

### Transaction Flow
```
User initiates transfer
    ↓
Validate Transaction PIN
    ↓
Check sender wallet balance
    ↓
Apply transaction charges (if applicable)
    ↓
Begin atomic transaction:
    - Debit sender wallet
    - Credit receiver wallet
    - Credit system wallet (for fees)
    - Create Transaction record
    ↓
Send real-time notification (WebSocket + WhatsApp)
    ↓
Return success response
```

### KYC Verification Levels
- **Level 0**: Phone number verified (default on signup)
- **Level 1**: National ID submitted and approved
- **Level 2**: Address proof submitted and approved

Each level has corresponding transaction limits enforced at the application level.

### Payment Gateway Integration
- **EcoCash**: C2B (Cash-In) and B2C (Cash-Out) operations
- **Paynow**: Merchant payment processing
- All gateway operations are processed via Celery tasks for reliability

---

## Coding Standards & Conventions

### Python (Django Backend)

#### File Organization
- One model per major concept (User, Wallet, Transaction, etc.)
- Serializers in `serializers.py`
- Views in `views.py` or `viewsets.py` for DRF ViewSets
- URL patterns in `urls.py`
- Celery tasks in `tasks.py`

#### Naming Conventions
- **Models**: PascalCase singular (e.g., `Transaction`, `UserProfile`)
- **Functions/Methods**: snake_case (e.g., `process_payment`, `validate_pin`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_TRANSACTION_AMOUNT`)
- **Private methods**: Prefix with underscore (e.g., `_calculate_fee`)

#### Django Best Practices
```python
# ✅ Good: Use Django ORM for queries
wallet = Wallet.objects.get(user=user)

# ❌ Avoid: Raw SQL queries (unless absolutely necessary)
# Use raw SQL only for complex queries that can't be expressed in ORM

# ✅ Good: Use select_related for foreign keys
transactions = Transaction.objects.select_related('sender', 'receiver').all()

# ✅ Good: Use atomic transactions for financial operations
from django.db import transaction

@transaction.atomic
def transfer_funds(sender, receiver, amount):
    # All operations here are atomic
    pass

# ✅ Good: Validate input with serializers
serializer = TransferSerializer(data=request.data)
serializer.is_valid(raise_exception=True)

# ✅ Good: Use decimal.Decimal for currency
from decimal import Decimal
amount = Decimal('100.00')
```

#### Authentication & Permissions
- Use `IsAuthenticated` permission class for protected endpoints
- Use custom permissions for role-based access (e.g., `IsMerchant`, `IsAgent`)
- Always validate Transaction PIN before financial operations
- Use `@permission_required` decorator for admin actions

### JavaScript/TypeScript (Next.js Frontend)

#### File Organization
- Pages/Routes in `src/app/` (Next.js 14+ App Router)
- Reusable components in `src/components/`
- API utilities in `src/lib/api/`
- Type definitions in `src/types/`

#### Naming Conventions
- **Components**: PascalCase (e.g., `DashboardCard.tsx`, `TransactionList.tsx`)
- **Functions**: camelCase (e.g., `fetchUserData`, `formatCurrency`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **Types/Interfaces**: PascalCase with 'I' prefix for interfaces (e.g., `IUser`, `ITransaction`)

#### React Best Practices
```typescript
// ✅ Good: Use TypeScript for type safety
interface Transaction {
  id: string;
  amount: number;
  timestamp: string;
}

// ✅ Good: Use async/await for API calls
const fetchTransactions = async () => {
  try {
    const response = await fetch('/api/transactions');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
  }
};

// ✅ Good: Use Tailwind CSS utility classes
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <span className="text-gray-700 font-medium">Balance</span>
  <span className="text-2xl font-bold text-green-600">${balance}</span>
</div>

// ❌ Avoid: Inline styles
<div style={{ display: 'flex', padding: '16px' }}>
```

---

## Security Guidelines

### Critical Security Rules

1. **Never commit secrets**: Use environment variables (`.env`) for all sensitive data
2. **Validate all inputs**: Use Django serializers for backend, Zod/Yup for frontend
3. **Sanitize user data**: Prevent SQL injection, XSS, and CSRF attacks
4. **Rate limiting**: Implement rate limiting on authentication and financial endpoints
5. **Transaction PINs**: Always hash PINs using Django's password hashers
6. **JWT tokens**: Use short expiration times (15 minutes for access, 7 days for refresh)
7. **Audit logging**: Log all financial operations with user context

### Sensitive Operations Checklist
Before implementing any financial operation:
- [ ] Is the user authenticated?
- [ ] Is the Transaction PIN validated?
- [ ] Are all inputs validated and sanitized?
- [ ] Is the operation idempotent?
- [ ] Is there an audit trail?
- [ ] Are balances checked before debiting?
- [ ] Is the transaction atomic (all-or-nothing)?
- [ ] Are appropriate notifications sent?

---

## Testing Strategy

### Backend Testing
```bash
# Run all tests
cd ovii_backend
python manage.py test

# Run specific app tests
python manage.py test wallets
python manage.py test users

# Run with coverage
coverage run --source='.' manage.py test
coverage report
```

### Test Organization
- Unit tests for models, serializers, and utility functions
- Integration tests for API endpoints
- Transaction tests should use test database and rollback
- Mock external API calls (payment gateways, WhatsApp)

### Frontend Testing
```bash
cd ovii-frontend
npm test          # Run Jest tests
npm run lint      # Run ESLint
npm run build     # Verify build succeeds
```

---

## Common Patterns & Practices

### Celery Tasks
Use Celery for long-running or background operations:
- Sending emails and WhatsApp messages
- Processing payment gateway callbacks
- Generating reports
- Batch operations

```python
# wallets/tasks.py
from celery import shared_task

@shared_task
def send_transaction_notification(transaction_id):
    transaction = Transaction.objects.get(id=transaction_id)
    # Send notification logic here
    pass
```

### WebSocket Notifications
Real-time notifications use Django Channels:
- Transaction confirmations
- KYC approval status
- Account alerts

### API Response Format
All API responses follow this structure:
```json
{
  "status": "success|error",
  "message": "Human-readable message",
  "data": { /* Response payload */ }
}
```

---

## Troubleshooting & Debugging

### Common Issues

#### Redis Connection Issues
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# Start Redis (if not running)
redis-server
```

#### Celery Worker Issues
```bash
# List active tasks
celery -A ovii_backend inspect active

# Purge all tasks
celery -A ovii_backend purge

# Check worker status
celery -A ovii_backend inspect stats
```

#### Database Migration Issues
```bash
# Create migrations
python manage.py makemigrations

# Show migration SQL
python manage.py sqlmigrate wallets 0001

# Check for migration conflicts
python manage.py showmigrations
```

### Debugging Tips
- Use `python manage.py shell` for interactive debugging
- Use `python manage.py dbshell` for database inspection
- Check logs in `ovii_backend/logs/` (if configured)
- Use Django Debug Toolbar in development (if installed)

---

## Important Reminders for AI Agents

1. **This is production financial software**: Triple-check all financial logic
2. **Phone numbers are the primary identifier**: Not email, not username
3. **Transaction PINs are separate from passwords**: Don't confuse the two
4. **Always use atomic transactions**: For any operation involving money
5. **Test thoroughly**: Financial bugs are expensive and reputation-damaging
6. **Follow existing patterns**: Consistency is key in a fintech codebase
7. **Security first, features second**: Never compromise on security

---

## Additional Resources

- **Main Documentation**: See `README.md` for setup instructions
- **API Documentation**: See backend `/api/docs/` endpoint (if configured)
- **Copilot Instructions**: See `.github/copilot-instructions.md`
- **WhatsApp Integration**: See `WHATSAPP_INTEGRATION.md`
- **Progress & Roadmap**: See `ROADMAP_ASSESSMENT.md`

---

**Copyright © 2025 Moreblessing Nyemba & Ovii. All Rights Reserved.**
