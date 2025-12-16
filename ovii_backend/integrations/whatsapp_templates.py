"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-12-09
Description: WhatsApp message template definitions for Ovii.
These templates need to be created and approved in Meta Business Manager.
"""

# Template definitions for WhatsApp Business Cloud API
# These templates must be created and approved in Meta Business Manager before use

WHATSAPP_TEMPLATES = {
    "otp_verification": {
        "name": "otp_verification",
        "category": "AUTHENTICATION",
        "language": "en",
        "description": "OTP verification message for user authentication",
        "structure": {
            "header": None,
            "body": "Your Ovii verification code is: {{1}}\n\nThis code expires in 5 minutes. Do not share this code with anyone.",
            "footer": "Ovii - Your Mobile Wallet",
            "buttons": [],
        },
        "variables": ["code"],
        "example": {"body_text": [["123456"]]},
    },
    "transaction_received": {
        "name": "transaction_received",
        "category": "MARKETING",
        "language": "en",
        "description": "Notification when user receives money",
        "structure": {
            "header": None,
            "body": "You have received {{1}} {{2}} from {{3}}.\n\nNew balance: {{4}} {{5}}\n\nTransaction ID: {{6}}",
            "footer": "Ovii - Your Mobile Wallet",
            "buttons": [],
        },
        # Note: currency appears twice - once after amount, once after new_balance
        "variables": [
            "amount",
            "currency",
            "sender_name",
            "new_balance",
            "currency",
            "transaction_id",
        ],
        "example": {
            "body_text": [["10.00", "USD", "John Doe", "110.00", "USD", "TXN123456"]]
        },
    },
    "transaction_sent": {
        "name": "transaction_sent",
        "category": "MARKETING",
        "language": "en",
        "description": "Notification when user sends money",
        "structure": {
            "header": None,
            "body": "You have sent {{1}} {{2}} to {{3}}.\n\nNew balance: {{4}} {{5}}\n\nTransaction ID: {{6}}",
            "footer": "Ovii - Your Mobile Wallet",
            "buttons": [],
        },
        # Note: currency appears twice - once after amount, once after new_balance
        "variables": [
            "amount",
            "currency",
            "recipient_name",
            "new_balance",
            "currency",
            "transaction_id",
        ],
        "example": {
            "body_text": [["10.00", "USD", "Jane Smith", "90.00", "USD", "TXN123456"]]
        },
    },
    "welcome_message": {
        "name": "welcome_message",
        "category": "MARKETING",
        "language": "en",
        "description": "Welcome message for new users",
        "structure": {
            "header": None,
            "body": "Welcome to Ovii, {{1}}! 🎉\n\nYour wallet has been created successfully. You can now:\n• Send and receive money\n• Top up your wallet\n• View transaction history\n\nStart your financial journey with us today!",
            "footer": "Ovii - Your Mobile Wallet",
            "buttons": [],
        },
        "variables": ["user_name"],
        "example": {"body_text": [["John"]]},
    },
    "deposit_confirmed": {
        "name": "deposit_confirmed",
        "category": "MARKETING",
        "language": "en",
        "description": "Notification when deposit is confirmed",
        "structure": {
            "header": None,
            "body": "Your deposit of {{1}} {{2}} has been confirmed.\n\nNew balance: {{3}} {{4}}\n\nTransaction ID: {{5}}",
            "footer": "Ovii - Your Mobile Wallet",
            "buttons": [],
        },
        # Note: currency appears twice - once after amount, once after new_balance
        "variables": [
            "amount",
            "currency",
            "new_balance",
            "currency",
            "transaction_id",
        ],
        "example": {"body_text": [["50.00", "USD", "150.00", "USD", "TXN123456"]]},
    },
    "withdrawal_processed": {
        "name": "withdrawal_processed",
        "category": "MARKETING",
        "language": "en",
        "description": "Notification when withdrawal is processed",
        "structure": {
            "header": None,
            "body": "Your withdrawal of {{1}} {{2}} has been processed successfully.\n\nNew balance: {{3}} {{4}}\n\nTransaction ID: {{5}}",
            "footer": "Ovii - Your Mobile Wallet",
            "buttons": [],
        },
        # Note: currency appears twice - once after amount, once after new_balance
        "variables": [
            "amount",
            "currency",
            "new_balance",
            "currency",
            "transaction_id",
        ],
        "example": {"body_text": [["25.00", "USD", "75.00", "USD", "TXN123456"]]},
    },
    "transaction_failed": {
        "name": "transaction_failed",
        "category": "MARKETING",
        "language": "en",
        "description": "Notification when a transaction fails",
        "structure": {
            "header": None,
            "body": "Your transaction of {{1}} {{2}} has failed.\n\nReason: {{3}}\n\nTransaction ID: {{4}}\n\nYour balance remains unchanged. Please try again or contact support if the issue persists.",
            "footer": "Ovii - Your Mobile Wallet",
            "buttons": [],
        },
        "variables": ["amount", "currency", "reason", "transaction_id"],
        "example": {"body_text": [["50.00", "USD", "Insufficient funds", "TXN123456"]]},
    },
    "deposit_failed": {
        "name": "deposit_failed",
        "category": "MARKETING",
        "language": "en",
        "description": "Notification when a deposit fails",
        "structure": {
            "header": None,
            "body": "Your deposit of {{1}} {{2}} has failed.\n\nReason: {{3}}\n\nTransaction ID: {{4}}\n\nPlease contact support if you need assistance.",
            "footer": "Ovii - Your Mobile Wallet",
            "buttons": [],
        },
        "variables": ["amount", "currency", "reason", "transaction_id"],
        "example": {
            "body_text": [["100.00", "USD", "Payment gateway error", "TXN123456"]]
        },
    },
    "withdrawal_failed": {
        "name": "withdrawal_failed",
        "category": "MARKETING",
        "language": "en",
        "description": "Notification when a withdrawal fails",
        "structure": {
            "header": None,
            "body": "Your withdrawal of {{1}} {{2}} has failed.\n\nReason: {{3}}\n\nTransaction ID: {{4}}\n\nYour balance remains unchanged. Please try again or contact support.",
            "footer": "Ovii - Your Mobile Wallet",
            "buttons": [],
        },
        "variables": ["amount", "currency", "reason", "transaction_id"],
        "example": {
            "body_text": [["75.00", "USD", "External service unavailable", "TXN123456"]]
        },
    },
    "kyc_approved": {
        "name": "kyc_approved",
        "category": "MARKETING",
        "language": "en",
        "description": "Notification when KYC document is approved",
        "structure": {
            "header": None,
            "body": "Congratulations! Your identity verification has been approved. ✅\n\nYour account verification level: {{1}}\n\nYou now have access to additional features and higher transaction limits.",
            "footer": "Ovii - Your Mobile Wallet",
            "buttons": [],
        },
        "variables": ["verification_level"],
        "example": {"body_text": [["Identity Verified"]]},
    },
    "kyc_rejected": {
        "name": "kyc_rejected",
        "category": "MARKETING",
        "language": "en",
        "description": "Notification when KYC document is rejected",
        "structure": {
            "header": None,
            "body": "Your identity verification has been declined.\n\nReason: {{1}}\n\nPlease resubmit your documents ensuring they are:\n• Clear and readable\n• Valid and not expired\n• Match your account information\n\nContact support if you need assistance.",
            "footer": "Ovii - Your Mobile Wallet",
            "buttons": [],
        },
        "variables": ["reason"],
        "example": {"body_text": [["Document image is unclear"]]},
    },
    "referral_bonus_credited": {
        "name": "referral_bonus_credited",
        "category": "MARKETING",
        "language": "en",
        "description": "Notification when referral bonus is credited",
        "structure": {
            "header": None,
            "body": "Great news! 🎉\n\nYou've earned a referral bonus of {{1}} {{2}}.\n\nNew balance: {{3}} {{4}}\n\nKeep sharing Ovii with friends to earn more rewards!",
            "footer": "Ovii - Your Mobile Wallet",
            "buttons": [],
        },
        # Note: currency appears twice - once after bonus amount, once after new_balance
        "variables": ["bonus_amount", "currency", "new_balance", "currency"],
        "example": {"body_text": [["5.00", "USD", "105.00", "USD"]]},
    },
    "payment_received": {
        "name": "payment_received",
        "category": "MARKETING",
        "language": "en",
        "description": "Notification when merchant receives a payment",
        "structure": {
            "header": None,
            "body": "Payment received! 💰\n\nYou received {{1}} {{2}} from {{3}}.\n\nNew balance: {{4}} {{5}}\n\nTransaction ID: {{6}}",
            "footer": "Ovii - Your Mobile Wallet",
            "buttons": [],
        },
        # Note: currency appears twice - once after amount, once after new_balance
        "variables": [
            "amount",
            "currency",
            "customer_name",
            "new_balance",
            "currency",
            "transaction_id",
        ],
        "example": {
            "body_text": [["25.00", "USD", "John Doe", "525.00", "USD", "TXN123456"]]
        },
    },
    "payment_sent": {
        "name": "payment_sent",
        "category": "MARKETING",
        "language": "en",
        "description": "Notification when user makes a payment to merchant",
        "structure": {
            "header": None,
            "body": "Payment successful! ✅\n\nYou paid {{1}} {{2}} to {{3}}.\n\nNew balance: {{4}} {{5}}\n\nTransaction ID: {{6}}",
            "footer": "Ovii - Your Mobile Wallet",
            "buttons": [],
        },
        # Note: currency appears twice - once after amount, once after new_balance
        "variables": [
            "amount",
            "currency",
            "merchant_name",
            "new_balance",
            "currency",
            "transaction_id",
        ],
        "example": {
            "body_text": [["15.00", "USD", "ABC Store", "85.00", "USD", "TXN123456"]]
        },
    },
}


def get_template_structure(template_name: str) -> dict:
    """
    Get the structure of a specific template.

    Args:
        template_name: Name of the template

    Returns:
        dict: Template structure or None if not found
    """
    return WHATSAPP_TEMPLATES.get(template_name)


def get_all_templates() -> dict:
    """
    Get all available WhatsApp templates.

    Returns:
        dict: All template definitions
    """
    return WHATSAPP_TEMPLATES


def format_template_components(template_name: str, variables: dict) -> list:
    """
    Format template components with provided variables.

    Args:
        template_name: Name of the template
        variables: Dictionary of variable names and values

    Returns:
        list: Formatted components for WhatsApp API
    """
    template = WHATSAPP_TEMPLATES.get(template_name)
    if not template:
        raise ValueError(f"Template '{template_name}' not found")

    components = []

    # Build body component with variables
    if template["structure"]["body"]:
        parameters = []
        for var in template["variables"]:
            if var in variables:
                parameters.append({"type": "text", "text": str(variables[var])})

        if parameters:
            components.append({"type": "body", "parameters": parameters})

    return components
