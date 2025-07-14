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
    source_user = serializers.CharField(source='source_wallet.user.phone_number', read_only=True)
    destination_user = serializers.CharField(source='destination_wallet.user.phone_number', read_only=True)

    class Meta:
        model = Transaction
        fields = ['id', 'source_user', 'destination_user', 'amount', 'status', 'timestamp']
        read_only_fields = fields


class TransactionCreateSerializer(serializers.Serializer):
    """
    Write-only serializer for creating a new peer-to-peer transaction.
    Validates the destination user, amount, and transaction PIN.
    """
    destination_phone_number = PhoneNumberField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    pin = serializers.CharField(write_only=True, style={'input_type': 'password'}, min_length=4, max_length=4)

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
            data['destination_wallet'] = destination_user.wallet
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