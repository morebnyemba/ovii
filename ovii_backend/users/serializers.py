"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-20
Description: Defines serializers for the users app.
"""

from rest_framework import serializers
from django.utils import timezone
from phonenumber_field.serializerfields import PhoneNumberField
from rest_framework_simplejwt.tokens import RefreshToken
from .models import OviiUser, OTPRequest, KYCDocument
from .tasks import generate_and_log_otp, send_welcome_notification
from .services import get_or_create_user_on_otp_verify

class UserDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for retrieving and updating user details.
    Used for the /me endpoint and admin user management.
    """
    class Meta:
        model = OviiUser
        # Exclude password from being read.
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone_number',
            'profile_picture', 'id_number', 'date_of_birth', 'gender',
            'address_line_1', 'address_line_2', 'city', 'postal_code', 'country',
            'date_joined', 'last_login', 'is_active',
            'has_set_pin', 'verification_level'
        ]
        # Make fields read-only that should not be updated by the user via this serializer.
        read_only_fields = [
            'phone_number', 'email', 'id_number', 'date_of_birth', 'gender',
            'date_joined', 'last_login', 'is_active', 'has_set_pin', 'verification_level'
        ]


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    A specific serializer for allowing users to update a limited set of their profile data.
    """
    class Meta:
        model = OviiUser
        # Only include fields that a user is allowed to change after registration.
        fields = ['profile_picture', 'address_line_1', 'address_line_2', 'city', 'postal_code', 'country']


class AdminUserManagementSerializer(serializers.ModelSerializer):
    """
    Serializer for administrators to manage user details.
    Allows updating more fields than the standard UserDetailSerializer.
    """
    class Meta:
        model = OviiUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone_number',
            'profile_picture', 'id_number', 'date_of_birth', 'gender',
            'address_line_1', 'address_line_2', 'city', 'postal_code', 'country',
            'date_joined', 'last_login', 'is_active',
            'has_set_pin', 'verification_level'
        ]
        read_only_fields = ['phone_number', 'date_joined', 'last_login']


class SetTransactionPINSerializer(serializers.Serializer):
    """Serializer for setting or changing a user's transaction PIN."""
    pin = serializers.CharField(write_only=True, style={'input_type': 'password'}, min_length=4, max_length=4)
    confirm_pin = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, data):
        if data['pin'] != data['confirm_pin']:
            raise serializers.ValidationError({"confirm_pin": "PINs do not match."})
        if not data['pin'].isdigit():
            raise serializers.ValidationError({"pin": "PIN must be numeric."})
        return data


class OTPRequestSerializer(serializers.Serializer):
    """
    Serializer for requesting an OTP. Takes an email and triggers OTP generation.
    """
    phone_number = PhoneNumberField(write_only=True)

    def create(self, validated_data):
        phone_number = validated_data['phone_number']
        # Trigger the Celery task to generate and log the OTP and get the request_id
        task_result = generate_and_log_otp.delay(str(phone_number))
        return {'request_id': task_result.get()}


class OTPVerificationSerializer(serializers.Serializer):
    """
    Serializer for verifying an OTP and logging in or registering a user.
    """
    request_id = serializers.UUIDField(write_only=True)
    code = serializers.CharField(max_length=6, min_length=6, write_only=True)
    # New fields for KYC check during verification
    id_number = serializers.CharField(max_length=50, write_only=True)
    first_name = serializers.CharField(max_length=150, write_only=True)
    last_name = serializers.CharField(max_length=150, write_only=True)
    date_of_birth = serializers.DateField(write_only=True)
    gender = serializers.ChoiceField(choices=OviiUser.Gender.choices, write_only=True)
    # All personal details are now required on registration.
    email = serializers.EmailField(write_only=True)
    address_line_1 = serializers.CharField(max_length=255, write_only=True)
    address_line_2 = serializers.CharField(max_length=255, required=False, allow_blank=True, write_only=True)
    city = serializers.CharField(max_length=100, write_only=True)
    postal_code = serializers.CharField(max_length=20, write_only=True)
    country = serializers.CharField(max_length=100, write_only=True)

    def validate(self, attrs):
        request_id = attrs['request_id']
        code = attrs['code']

        try:
            otp_request = OTPRequest.objects.get(request_id=request_id, code=code)
        except OTPRequest.DoesNotExist:
            raise serializers.ValidationError("Invalid OTP or Request ID.")

        if otp_request.is_expired():
            raise serializers.ValidationError("OTP has expired.")

        attrs['otp_request'] = otp_request
        return attrs

    def validate_email(self, value):
        """
        Check that the email is not already in use.
        """
        if OviiUser.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return value

    def create(self, validated_data):
        otp_request = validated_data['otp_request']
        user, created = get_or_create_user_on_otp_verify(validated_data)

        if not user.is_active:
            user.is_active = True
            user.save(update_fields=['is_active'])

        if created:
            send_welcome_notification.delay(user.id)

        otp_request.delete()

        refresh = RefreshToken.for_user(user)
        return {
            'user': UserDetailSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }


class KYCDocumentSerializer(serializers.ModelSerializer):
    """Serializer for uploading and viewing KYC documents."""
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = KYCDocument
        fields = ['id', 'user', 'document_type', 'document_image', 'status', 'uploaded_at']
        read_only_fields = ['id', 'status', 'uploaded_at']