"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-20
Description: Defines serializers for the wallets app.
"""

from decimal import Decimal
from rest_framework import serializers
from phonenumber_field.serializerfields import PhoneNumberField

from .models import Wallet, Transaction
from users.models import OviiUser
from agents.models import Agent


class WalletSerializer(serializers.ModelSerializer):
    """
    Read-only serializer for the Wallet model.
    Displays the authenticated user's wallet details.
    """
    # Display the user's phone number instead of their ID.
    user = serializers.StringRelatedField()

    class Meta:
        model = Wallet
        fields = ['user', 'balance', 'currency', 'updated_at']
        read_only_fields = fields


class TransactionSerializer(serializers.ModelSerializer):
    """
    Read-only serializer for the Transaction model.
    Displays transaction history with user-friendly phone numbers.
    """
    sender = serializers.CharField(source='sender_identifier', read_only=True)
    receiver = serializers.CharField(source='receiver_identifier', read_only=True, allow_null=True)
    transaction_type = serializers.CharField(source='get_transaction_type_display', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id',
            'sender',
            'receiver',
            'amount',
            'status',
            'transaction_type',
            'description',
            'timestamp'
        ]
        read_only_fields = fields


class TransactionCreateSerializer(serializers.Serializer):
    """
    Write-only serializer for creating a new peer-to-peer transaction.
    Validates the destination user, amount, and transaction PIN.
    """
    destination_phone_number = PhoneNumberField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    pin = serializers.CharField(write_only=True, style={'input_type': 'password'}, min_length=4, max_length=4)
    description = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def validate_amount(self, value):
        """Check that the amount is positive."""
        if value <= Decimal('0.00'):
            raise serializers.ValidationError("Amount must be a positive number.")
        return value

    def validate(self, data):
        """
        Validate the entire transaction data, including destination user and PIN.
        """
        user = self.context['request'].user
        destination_phone_number = data['destination_phone_number']
        pin = data['pin']

        # Check if the destination user exists and has a wallet
        try:
            destination_user = OviiUser.objects.get(phone_number=destination_phone_number)
            # It's good practice to explicitly check for the related wallet.
            if not hasattr(destination_user, 'wallet'):
                raise Wallet.DoesNotExist()
            data['destination_wallet'] = getattr(destination_user, 'wallet')
        except (OviiUser.DoesNotExist, Wallet.DoesNotExist):
            raise serializers.ValidationError({"destination_phone_number": "User with this phone number does not have a wallet."})

        # Prevent users from sending money to themselves
        if user == destination_user:
            raise serializers.ValidationError({"destination_phone_number": "You cannot send money to yourself."})

        # Validate the transaction PIN
        if not user.has_set_pin:
            raise serializers.ValidationError({"pin": "You must set a transaction PIN before making transfers."})
        if not user.check_pin(pin):
            raise serializers.ValidationError({"pin": "Incorrect transaction PIN."})

        return data


class CustomerCashOutRequestSerializer(serializers.Serializer):
    """
    Serializer for a customer to request a cash-out from an agent.
    Validates the agent's code, amount, and the customer's PIN.
    """
    agent_code = serializers.CharField(max_length=20)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    pin = serializers.CharField(write_only=True, style={'input_type': 'password'}, min_length=4, max_length=4)

    def validate_amount(self, value):
        """Check that the amount is positive."""
        if value <= Decimal('0.00'):
            raise serializers.ValidationError("Amount must be a positive number.")
        return value

    def validate(self, data):
        """
        Validate the entire transaction data, including agent and customer's PIN.
        """
        customer_user = self.context['request'].user
        agent_code = data['agent_code']
        pin = data['pin']

        # Check if the agent exists, is approved, and has a wallet
        try:
            agent = Agent.objects.select_related('user__wallet').get(agent_code__iexact=agent_code, is_approved=True)
            if not hasattr(agent.user, 'wallet'):
                raise Wallet.DoesNotExist()
            data['agent_wallet'] = agent.user.wallet
        except (Agent.DoesNotExist, Wallet.DoesNotExist):
            raise serializers.ValidationError({"agent_code": "An approved agent with this code could not be found."})

        # Validate the customer's transaction PIN
        if not customer_user.has_set_pin:
            raise serializers.ValidationError({"pin": "You must set your transaction PIN before performing this action."})
        if not customer_user.check_pin(pin):
            raise serializers.ValidationError({"pin": "Incorrect transaction PIN."})

        return data


class AgentCashInSerializer(serializers.Serializer):
    """
    Serializer for an agent to perform a cash-in (deposit) for a customer.
    Validates the customer's phone number, amount, and the agent's PIN.
    """
    customer_phone_number = PhoneNumberField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    pin = serializers.CharField(write_only=True, style={'input_type': 'password'}, min_length=4, max_length=4)

    def validate_amount(self, value):
        """Check that the amount is positive."""
        if value <= Decimal('0.00'):
            raise serializers.ValidationError("Amount must be a positive number.")
        return value

    def validate(self, data):
        """
        Validate the entire transaction data, including customer and agent's PIN.
        """
        agent_user = self.context['request'].user
        customer_phone_number = data['customer_phone_number']
        pin = data['pin']

        # Check if the customer user exists and has a wallet
        try:
            customer_user = OviiUser.objects.get(phone_number=customer_phone_number, role=OviiUser.Role.CUSTOMER)
            if not hasattr(customer_user, 'wallet'):
                raise Wallet.DoesNotExist()
            data['customer_wallet'] = getattr(customer_user, 'wallet')
        except (OviiUser.DoesNotExist, Wallet.DoesNotExist):
            raise serializers.ValidationError({"customer_phone_number": "A customer with this phone number does not have a wallet."})

        # Prevent agents from depositing to themselves
        if agent_user == customer_user:
            raise serializers.ValidationError({"customer_phone_number": "You cannot perform a cash-in for yourself."})

        # Validate the agent's transaction PIN
        if not agent_user.has_set_pin:
            raise serializers.ValidationError({"pin": "You must set your transaction PIN before performing this action."})
        if not agent_user.check_pin(pin):
            raise serializers.ValidationError({"pin": "Incorrect transaction PIN."})

        return data


class MerchantPaymentRequestSerializer(serializers.Serializer):
    """
    Serializer for a merchant to request a payment from a customer.
    Validates the customer's phone number and the amount.
    """
    customer_phone_number = PhoneNumberField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    description = serializers.CharField(max_length=100, required=False, allow_blank=True)
    # A unique ID from the merchant's system to prevent duplicate requests.
    external_reference_id = serializers.CharField(max_length=100, required=False, allow_blank=True)

    def validate_amount(self, value):
        """Check that the amount is positive."""
        if value <= Decimal('0.00'):
            raise serializers.ValidationError("Amount must be a positive number.")
        return value

    def validate_customer_phone_number(self, value):
        """Check that the customer exists and has a wallet."""
        try:
            customer_user = OviiUser.objects.get(phone_number=value, role=OviiUser.Role.CUSTOMER)
            if not hasattr(customer_user, 'wallet'):
                raise serializers.ValidationError("This customer does not have an active wallet.")
        except OviiUser.DoesNotExist:
            raise serializers.ValidationError("A customer with this phone number was not found.")
        return value


class ApproveMerchantPaymentSerializer(serializers.Serializer):
    """
    Serializer for a customer to approve a pending merchant payment.
    Validates the customer's PIN.
    """
    pin = serializers.CharField(write_only=True, style={'input_type': 'password'}, min_length=4, max_length=4)

    def validate(self, data):
        """
        Validate the customer's transaction PIN.
        """
        customer_user = self.context['request'].user
        pin = data['pin']

        # Validate the customer's transaction PIN
        if not customer_user.has_set_pin:
            raise serializers.ValidationError({"pin": "You must set your transaction PIN before approving payments."})
        if not customer_user.check_pin(pin):
            raise serializers.ValidationError({"pin": "Incorrect transaction PIN."})

        return data