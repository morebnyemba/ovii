# Wallets App Templates

This directory contains Django templates for the wallets application.

## Structure

```
wallets/templates/
└── admin/
    └── wallet_top_up_intermediate.html
```

## Templates

### wallet_top_up_intermediate.html
- **Purpose**: Intermediate page for the admin action to top up wallet balances
- **Used by**: `WalletAdmin.top_up_wallets_action()` in `admin.py`
- **Extends**: `admin/base_site.html`
- **Context variables**:
  - `form`: WalletTopUpForm instance
  - `wallets`: QuerySet of selected wallets
  - `wallet_ids`: Comma-separated wallet IDs

## Django Template Loading

Django finds these templates automatically because:
1. `APP_DIRS=True` in settings.py
2. Templates are in the `<app_name>/templates/` directory
3. The path within templates/ matches the path in `render()` calls

Example: `render(request, "admin/wallet_top_up_intermediate.html", context)`
→ Django looks in `wallets/templates/admin/wallet_top_up_intermediate.html`
