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
    pin_confirmation = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, data):
        if data['pin'] != data['pin_confirmation']:
            raise serializers.ValidationError({"pin_confirmation": "PINs do not match."})
        if not data['pin'].isdigit():
            raise serializers.ValidationError({"pin": "PIN must be numeric."})
        return data


class InitialRegistrationSerializer(serializers.Serializer):
    """
    Serializer for the first step of registration.
    Collects basic info, creates an inactive user, and triggers an OTP.
    """
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone_number = PhoneNumberField()
    email = serializers.EmailField(required=False, allow_blank=True)
    request_id = serializers.UUIDField(read_only=True, help_text="The unique ID for the OTP request. Send this back during verification.")

    def validate_phone_number(self, value):
        """Check if a user with this phone number already exists."""
        if OviiUser.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("An account with this phone number already exists. Please log in.")
        return value

    def validate_email(self, value):
        """Check that the email is not already in use, if provided."""
        if value and OviiUser.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return value

    def create(self, validated_data):
        # Create an inactive user first.
        OviiUser.objects.create_user(is_active=False, **validated_data)

        # Now, trigger the OTP generation for this phone number.
        phone_number = validated_data['phone_number']
        task_result = generate_and_log_otp.delay(str(phone_number))
        request_id = task_result.get()
        return {'request_id': request_id, 'phone_number': str(phone_number)}


class OTPRequestSerializer(serializers.Serializer):
    """
    Serializer for requesting an OTP. Takes a phone number and triggers OTP generation.
    """
    phone_number = PhoneNumberField(write_only=True)
    request_id = serializers.UUIDField(read_only=True, help_text="The unique ID for this OTP request. Send this back during verification.")

    def create(self, validated_data):
        phone_number = validated_data['phone_number']
        # Trigger the Celery task to generate and log the OTP and get the request_id
        task_result = generate_and_log_otp.delay(str(phone_number))
        # .get() makes this a synchronous operation. It's acceptable here as the task is fast.
        # Convert the PhoneNumber object to a string for the JSON response.
        return {'request_id': task_result.get(), 'phone_number': str(phone_number)}


class BaseOTPVerificationSerializer(serializers.Serializer):
    """
    Base serializer for OTP verification. Handles common validation logic.
    """
    request_id = serializers.UUIDField(write_only=True)
    code = serializers.CharField(max_length=6, min_length=6, write_only=True)

    def validate(self, attrs):
        request_id = attrs.get('request_id')
        code = attrs.get('code')

        try:
            otp_request = OTPRequest.objects.get(request_id=request_id, code=code)
        except OTPRequest.DoesNotExist:
            raise serializers.ValidationError("Invalid OTP or Request ID.")

        if otp_request.is_expired():
            raise serializers.ValidationError("OTP has expired.")

        attrs['otp_request'] = otp_request
        return attrs


class UserLoginSerializer(BaseOTPVerificationSerializer):
    """
    Serializer for verifying an OTP and logging in an existing user.
    """
    def validate(self, attrs):
        attrs = super().validate(attrs)
        otp_request = attrs['otp_request']

        try:
            user = OviiUser.objects.get(phone_number=otp_request.phone_number)
        except OviiUser.DoesNotExist:
            raise serializers.ValidationError("No account found with this phone number. Please register.")

        attrs['user'] = user
        return attrs

    def create(self, validated_data):
        user = validated_data['user']
        otp_request = validated_data['otp_request']

        if not user.is_active:
            user.is_active = True
            user.save(update_fields=['is_active'])

        otp_request.delete()

        refresh = RefreshToken.for_user(user)
        return {
            'user': UserDetailSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }


class UserRegistrationVerifySerializer(BaseOTPVerificationSerializer):
    """
    Serializer for the second step of registration: verifying an OTP to activate the user.
    """
    def validate(self, attrs):
        attrs = super().validate(attrs)
        otp_request = attrs['otp_request']

        try:
            # Find the inactive user created in the first step.
            user = OviiUser.objects.get(phone_number=otp_request.phone_number, is_active=False)
            attrs['user'] = user
        except OviiUser.DoesNotExist:
            raise serializers.ValidationError("Registration process not started or user already active. Please start registration again.")
        return attrs

    def create(self, validated_data):
        user = validated_data['user']
        otp_request = validated_data['otp_request']

        user.is_active = True
        user.save(update_fields=['is_active'])

        send_welcome_notification.delay(user.id)
        otp_request.delete()

        refresh = RefreshToken.for_user(user)
        return {
            '__debug_user_data__': UserDetailSerializer(user).data,  # Temporary debug line
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