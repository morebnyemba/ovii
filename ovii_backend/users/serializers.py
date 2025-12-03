"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-20
Description: Defines serializers for the users app.
"""

from rest_framework import serializers
from django.utils import timezone
from phonenumber_field.serializerfields import PhoneNumberField
from rest_framework_simplejwt.tokens import RefreshToken
from .models import OviiUser, OTPRequest, KYCDocument, VerificationLevels, Referral
from .tasks import generate_and_log_otp, create_user_wallet
from django_countries.serializer_fields import CountryField


class UserDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for retrieving and updating user details.
    Used for the /me endpoint and admin user management.
    """
    country = CountryField(country_dict=True)
    referral_count = serializers.SerializerMethodField()

    class Meta:
        model = OviiUser
        # Exclude password from being read.
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "profile_picture",
            "id_number",
            "date_of_birth",
            "gender",
            "address_line_1",
            "address_line_2",
            "city",
            "postal_code",
            "country",
            "date_joined",
            "last_login",
            "is_active",
            "has_set_pin",
            "verification_level",
            "referral_code",
            "referral_count",
        ]
        # Make fields read-only that should not be updated by the user via this serializer.
        read_only_fields = [
            "phone_number",
            "email",
            "id_number",
            "date_of_birth",
            "gender",
            "date_joined",
            "last_login",
            "is_active",
            "has_set_pin",
            "verification_level",
            "referral_code",
            "referral_count",
        ]

    def get_referral_count(self, obj):
        """Returns the count of successful referrals made by this user."""
        return obj.referrals.count()


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    A specific serializer for allowing users to update a limited set of their profile data.
    """

    class Meta:
        model = OviiUser
        # Only include fields that a user is allowed to change after registration.
        fields = [
            "profile_picture",
            "address_line_1",
            "address_line_2",
            "city",
            "postal_code",
            "country",
        ]


class AdminUserManagementSerializer(serializers.ModelSerializer):
    """
    Serializer for administrators to manage user details.
    Allows updating more fields than the standard UserDetailSerializer.
    """

    class Meta:
        model = OviiUser
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "profile_picture",
            "id_number",
            "date_of_birth",
            "gender",
            "address_line_1",
            "address_line_2",
            "city",
            "postal_code",
            "country",
            "date_joined",
            "last_login",
            "is_active",
            "has_set_pin",
            "verification_level",
        ]
        read_only_fields = ["phone_number", "date_joined", "last_login"]


class SetTransactionPINSerializer(serializers.Serializer):
    """Serializer for setting or changing a user's transaction PIN."""

    pin = serializers.CharField(
        write_only=True, style={"input_type": "password"}, min_length=4, max_length=4
    )
    pin_confirmation = serializers.CharField(
        write_only=True, style={"input_type": "password"}
    )

    def validate(self, data):
        if data["pin"] != data["pin_confirmation"]:
            raise serializers.ValidationError(
                {"pin_confirmation": "PINs do not match."}
            )
        if not data["pin"].isdigit():
            raise serializers.ValidationError({"pin": "PIN must be numeric."})
        return data


class InitialRegistrationSerializer(serializers.Serializer):
    """
    Serializer for the first step of registration.
    Collects basic info, creates an inactive user, and triggers an OTP.
    Optionally accepts a referral_code.
    """

    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone_number = PhoneNumberField()
    email = serializers.EmailField(required=False, allow_blank=True)
    referral_code = serializers.CharField(
        max_length=10,
        required=False,
        allow_blank=True,
        help_text="Optional referral code from another user.",
    )
    request_id = serializers.UUIDField(
        read_only=True,
        help_text="The unique ID for the OTP request. Send this back during verification.",
    )

    def validate_phone_number(self, value):
        """Check if a user with this phone number already exists."""
        if OviiUser.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError(
                "An account with this phone number already exists. Please log in."
            )
        return value

    def validate_email(self, value):
        """Check that the email is not already in use, if provided."""
        if value and OviiUser.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "An account with this email address already exists."
            )
        return value

    def validate_referral_code(self, value):
        """Check that the referral code is valid if provided."""
        if value:
            try:
                referrer = OviiUser.objects.get(referral_code=value.upper())
                return referrer
            except OviiUser.DoesNotExist:
                raise serializers.ValidationError("Invalid referral code.")
        return None

    def create(self, validated_data):
        # Extract referrer if referral code was provided
        referrer = validated_data.pop("referral_code", None)

        # Create an inactive user first.
        user = OviiUser.objects.create_user(is_active=False, **validated_data)

        # If a valid referrer was found, set the referred_by relationship
        if referrer:
            user.referred_by = referrer
            user.save(update_fields=["referred_by"])

        # Now, trigger the OTP generation for this phone number.
        phone_number = validated_data["phone_number"]
        task_result = generate_and_log_otp.delay(str(phone_number))
        request_id = task_result.get()
        return {"request_id": request_id, "phone_number": str(phone_number)}


class OTPRequestSerializer(serializers.Serializer):
    """
    Serializer for requesting an OTP. Takes a phone number and triggers OTP generation.
    """

    phone_number = PhoneNumberField(write_only=True)
    request_id = serializers.UUIDField(
        read_only=True,
        help_text="The unique ID for this OTP request. Send this back during verification.",
    )

    def create(self, validated_data):
        phone_number = validated_data["phone_number"]
        # Trigger the Celery task to generate and log the OTP and get the request_id
        task_result = generate_and_log_otp.delay(str(phone_number))
        # .get() makes this a synchronous operation. It's acceptable here as the task is fast.
        # Convert the PhoneNumber object to a string for the JSON response.
        return {"request_id": task_result.get(), "phone_number": str(phone_number)}


class BaseOTPVerificationSerializer(serializers.Serializer):
    """
    Base serializer for OTP verification. Handles common validation logic.
    """

    request_id = serializers.UUIDField(write_only=True)
    code = serializers.CharField(max_length=6, min_length=6, write_only=True)

    def validate(self, attrs):
        request_id = attrs.get("request_id")
        code = attrs.get("code")

        try:
            otp_request = OTPRequest.objects.get(request_id=request_id, code=code)
        except OTPRequest.DoesNotExist:
            raise serializers.ValidationError("Invalid OTP or Request ID.")

        if otp_request.is_expired():
            raise serializers.ValidationError("OTP has expired.")

        attrs["otp_request"] = otp_request
        return attrs


class UserLoginSerializer(BaseOTPVerificationSerializer):
    """
    Serializer for verifying an OTP and logging in an existing user.
    """

    def validate(self, attrs):
        attrs = super().validate(attrs)
        otp_request = attrs["otp_request"]

        try:
            user = OviiUser.objects.get(phone_number=otp_request.phone_number)
        except OviiUser.DoesNotExist:
            raise serializers.ValidationError(
                "No account found with this phone number. Please register."
            )

        attrs["user"] = user
        return attrs

    def create(self, validated_data):
        user = validated_data["user"]
        otp_request = validated_data["otp_request"]

        # Ensure has_set_pin is accurate before issuing a token.
        # This should prevent issues if the flag and the pin field get out of sync.
        user.has_set_pin = bool(user.pin)

        if not user.is_active:
            user.is_active = True

        user.save(update_fields=["is_active", "has_set_pin", "last_login"])
        otp_request.delete()

        # Re-fetch the user from the database to ensure we have the latest data.
        user.refresh_from_db()

        refresh = RefreshToken.for_user(user)
        # Add custom claims to the access token
        refresh.access_token["has_set_pin"] = user.has_set_pin

        return {
            "user": UserDetailSerializer(user).data,
            "tokens": {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
            "__debug_has_set_pin": user.has_set_pin,
        }


class UserRegistrationVerifySerializer(BaseOTPVerificationSerializer):
    """
    Serializer for the second step of registration: verifying an OTP to activate the user.
    """

    def validate(self, attrs):
        attrs = super().validate(attrs)
        otp_request = attrs["otp_request"]

        try:
            # Find the inactive user created in the first step.
            user = OviiUser.objects.get(
                phone_number=otp_request.phone_number, is_active=False
            )
            attrs["user"] = user
        except OviiUser.DoesNotExist:
            raise serializers.ValidationError(
                "Registration process not started or user already active. Please start registration again."
            )
        return attrs

    def create(self, validated_data):
        user = validated_data["user"]
        otp_request = validated_data["otp_request"]

        user.is_active = True
        # Set the user's verification level to Mobile Verified
        user.verification_level = VerificationLevels.LEVEL_1
        user.save(update_fields=["is_active", "verification_level"])

        # Asynchronously create the wallet and send a welcome notification.
        create_user_wallet.delay(user.id)
        otp_request.delete()

        refresh = RefreshToken.for_user(user)
        # Add custom claims to the access token
        refresh.access_token["has_set_pin"] = user.has_set_pin

        return {
            "__debug_user_data__": UserDetailSerializer(
                user
            ).data,  # Temporary debug line
            "user": UserDetailSerializer(user).data,
            "tokens": {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
        }


class KYCDocumentSerializer(serializers.ModelSerializer):
    """Serializer for uploading and viewing KYC documents."""

    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = KYCDocument
        fields = [
            "id",
            "user",
            "document_type",
            "document_image",
            "status",
            "uploaded_at",
        ]
        read_only_fields = ["id", "status", "uploaded_at"]


# --- Referral Serializers ---


class ReferralSerializer(serializers.ModelSerializer):
    """Serializer for viewing referral information."""

    referrer_phone = serializers.CharField(source="referrer.phone_number", read_only=True)
    referred_phone = serializers.CharField(source="referred.phone_number", read_only=True)
    referred_name = serializers.SerializerMethodField()

    class Meta:
        model = Referral
        fields = [
            "id",
            "referrer_phone",
            "referred_phone",
            "referred_name",
            "referral_code",
            "referrer_bonus",
            "referred_bonus",
            "bonus_status",
            "created_at",
            "credited_at",
        ]
        read_only_fields = fields

    def get_referred_name(self, obj):
        """Returns the name of the referred user."""
        return f"{obj.referred.first_name} {obj.referred.last_name}"


class GenerateReferralCodeSerializer(serializers.Serializer):
    """Serializer for generating a referral code."""

    referral_code = serializers.CharField(read_only=True)


# --- PIN Reset Serializers ---


class RequestPINResetSerializer(serializers.Serializer):
    """
    Serializer for requesting a PIN reset. Uses OTP verification.
    """

    request_id = serializers.UUIDField(
        read_only=True,
        help_text="The unique ID for the OTP request. Send this back during verification.",
    )

    def create(self, validated_data):
        user = self.context["request"].user
        # Trigger the Celery task to generate and log the OTP
        task_result = generate_and_log_otp.delay(str(user.phone_number))
        request_id = task_result.get()
        return {"request_id": request_id, "phone_number": str(user.phone_number)}


class VerifyAndResetPINSerializer(BaseOTPVerificationSerializer):
    """
    Serializer for verifying OTP and resetting the transaction PIN.
    """

    new_pin = serializers.CharField(
        write_only=True, style={"input_type": "password"}, min_length=4, max_length=4
    )
    new_pin_confirmation = serializers.CharField(
        write_only=True, style={"input_type": "password"}, min_length=4, max_length=4
    )

    def validate(self, attrs):
        # First, validate OTP
        attrs = super().validate(attrs)

        # Validate PIN match
        if attrs["new_pin"] != attrs["new_pin_confirmation"]:
            raise serializers.ValidationError(
                {"new_pin_confirmation": "PINs do not match."}
            )
        if not attrs["new_pin"].isdigit():
            raise serializers.ValidationError({"new_pin": "PIN must be numeric."})

        # Verify the OTP belongs to the authenticated user
        otp_request = attrs["otp_request"]
        user = self.context["request"].user
        if str(otp_request.phone_number) != str(user.phone_number):
            raise serializers.ValidationError("OTP does not match your phone number.")

        return attrs

    def create(self, validated_data):
        user = self.context["request"].user
        otp_request = validated_data["otp_request"]

        # Reset the PIN
        user.set_pin(validated_data["new_pin"])
        user.has_set_pin = True
        user.save(update_fields=["pin", "has_set_pin"])

        # Delete the used OTP
        otp_request.delete()

        # Issue new tokens with updated has_set_pin claim
        refresh = RefreshToken.for_user(user)
        refresh.access_token["has_set_pin"] = user.has_set_pin

        return {
            "detail": "PIN reset successfully.",
            "tokens": {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
        }
