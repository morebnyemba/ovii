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
            "buttons": []
        },
        "variables": ["code"],
        "example": {
            "body_text": [["123456"]]
        }
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
            "buttons": []
        },
        # Note: currency appears twice - once after amount, once after new_balance
        "variables": ["amount", "currency", "sender_name", "new_balance", "currency", "transaction_id"],
        "example": {
            "body_text": [["10.00", "USD", "John Doe", "110.00", "USD", "TXN123456"]]
        }
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
            "buttons": []
        },
        # Note: currency appears twice - once after amount, once after new_balance
        "variables": ["amount", "currency", "recipient_name", "new_balance", "currency", "transaction_id"],
        "example": {
            "body_text": [["10.00", "USD", "Jane Smith", "90.00", "USD", "TXN123456"]]
        }
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
            "buttons": []
        },
        "variables": ["user_name"],
        "example": {
            "body_text": [["John"]]
        }
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
            "buttons": []
        },
        # Note: currency appears twice - once after amount, once after new_balance
        "variables": ["amount", "currency", "new_balance", "currency", "transaction_id"],
        "example": {
            "body_text": [["50.00", "USD", "150.00", "USD", "TXN123456"]]
        }
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
            "buttons": []
        },
        # Note: currency appears twice - once after amount, once after new_balance
        "variables": ["amount", "currency", "new_balance", "currency", "transaction_id"],
        "example": {
            "body_text": [["25.00", "USD", "75.00", "USD", "TXN123456"]]
        }
    }
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
                parameters.append({
                    "type": "text",
                    "text": str(variables[var])
                })
        
        if parameters:
            components.append({
                "type": "body",
                "parameters": parameters
            })
    
    return components
