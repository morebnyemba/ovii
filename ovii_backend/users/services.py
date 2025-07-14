"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-20
Description: Defines service-layer functions for the users app.
"""

from rest_framework.exceptions import ValidationError
from .models import OviiUser


def get_or_create_user_on_otp_verify(validated_data: dict) -> tuple[OviiUser, bool]:
    """
    Handles the business logic of finding or creating a user during OTP verification.

    Args:
        validated_data: A dictionary of validated data from the OTPVerificationSerializer.

    Returns:
        A tuple containing the user object and a boolean indicating if the user was created.
    """
    phone_number = validated_data['otp_request'].phone_number
    id_number = validated_data['id_number']

    # Check if a user exists with the provided ID number
    existing_user_by_id = OviiUser.objects.filter(id_number=id_number).first()

    if existing_user_by_id:
        # User exists. This is a login attempt.
        # Security check: Does the phone number match the existing account?
        if existing_user_by_id.phone_number != phone_number:
            raise ValidationError(
                {"detail": "An account with this ID is already associated with a different phone number. Please contact support."}
            )
        return existing_user_by_id, False
    else:
        # No user with this ID. This is a registration attempt.
        # Security check: Does a user with this phone number already exist?
        if OviiUser.objects.filter(phone_number=phone_number).exists():
            raise ValidationError(
                {"detail": "This phone number is already registered. Please log in using your ID number."}
            )

        # Create a new user since they don't exist
        user_data = {
            'id_number': id_number,
            'first_name': validated_data['first_name'],
            'last_name': validated_data['last_name'],
            'date_of_birth': validated_data['date_of_birth'],
            'gender': validated_data['gender'],
            'email': validated_data['email'],
            'address_line_1': validated_data['address_line_1'],
            'address_line_2': validated_data.get('address_line_2', ''),
            'city': validated_data['city'],
            'postal_code': validated_data['postal_code'],
            'country': validated_data['country'],
        }
        user = OviiUser.objects.create_user(phone_number=phone_number, **user_data)
        return user, True