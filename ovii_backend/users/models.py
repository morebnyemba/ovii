"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-20
Description: Defines the custom User model for the Ovii project.
"""

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password
from phonenumber_field.modelfields import PhoneNumberField
from django.utils.translation import gettext_lazy as _
import uuid
from datetime import timedelta

class OviiUserManager(BaseUserManager):
    """
    Custom manager for the OviiUser model.

    This manager overrides the default `create_user` and `create_superuser`
    methods to use the phone number as the unique identifier instead of username.
    """

    def create_user(self, phone_number, password=None, **extra_fields):
        """
        Creates and saves a new User.
        
        New users are created as inactive and with no usable password until
        they verify their identity via OTP.
        """
        if not phone_number:
            raise ValueError(_('The Phone Number field must be set'))
        # New users are inactive until they verify OTP.
        extra_fields.setdefault('is_active', False)
        user = self.model(phone_number=phone_number, **extra_fields)
        # Regular users do not use passwords for login.
        user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number, email, password=None, **extra_fields):
        """
        Creates and saves a new superuser with a password.
        """
        if not phone_number:
            raise ValueError(_('Superusers must have a phone number.'))
        if not email:
            raise ValueError(_('Superusers must have an email address.'))
        if not password:
            raise ValueError(_('Superuser must have a password.'))

        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True) # Superusers are active by default

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        # We don't use create_user here to ensure a password is set
        user = self.model(phone_number=phone_number, email=self.normalize_email(email), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


class VerificationLevels(models.IntegerChoices):
    """Defines tiers for user KYC verification."""
    LEVEL_0 = 0, _('Unverified')
    LEVEL_1 = 1, _('Mobile Verified')
    LEVEL_2 = 2, _('Identity Verified')
    LEVEL_3 = 3, _('Address Verified')


class DocumentStatus(models.TextChoices):
    """Defines the status of a submitted KYC document."""
    PENDING = 'PENDING', _('Pending')
    APPROVED = 'APPROVED', _('Approved')
    REJECTED = 'REJECTED', _('Rejected')

class OviiUser(AbstractUser):
    class Gender(models.TextChoices):
        """Defines choices for the gender field."""
        MALE = 'MALE', _('Male')
        FEMALE = 'FEMALE', _('Female')
        OTHER = 'OTHER', _('Other')
        PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY', _('Prefer not to say')

    """
    Custom User model for the Ovii application.

    This model extends Django's AbstractUser, using the phone_number field as the
    primary identifier for authentication instead of a username.
    """
    # The default username field is removed. Authentication will be handled via email.
    username = None

    # Email field is now the unique identifier for the user.
    # It must be unique across all users in the database.
    phone_number = PhoneNumberField(_('phone number'), unique=True, help_text=_('Must be in international format, e.g., +263787211325'))
    email = models.EmailField(_('email address'), unique=False, null=True, blank=True)

    # The field used for authentication.
    USERNAME_FIELD = 'phone_number'
    # Fields required when creating a user via the createsuperuser command.
    # Email and password are required by default.
    REQUIRED_FIELDS = ['email']

    # Override is_active to be False by default for new users
    is_active = models.BooleanField(
        _('active'),
        default=False,
        help_text=_(
            'Designates whether this user should be treated as active. '
            'Unselect this instead of deleting accounts.'
        ),
    )

    # TODO (Phase 2): Integrate with a third-party service for phone number validation.
    # Custom field for the user's profile picture.
    # `upload_to` specifies the subdirectory within MEDIA_ROOT to store uploaded images.
    # `blank=True` and `null=True` make the profile picture optional.
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)

    # --- Fintech-specific fields ---

    # A separate, hashed PIN for authorizing transactions.
    transaction_pin = models.CharField(_('transaction pin'), max_length=128, blank=True)

    # A unique identifier for KYC purposes.
    id_number = models.CharField(
        _('national id number'),
        max_length=50,
        unique=True,
        null=True, # Will be populated during the verification step.
        blank=True,
        help_text=_('National ID or other official identification number.')
    )
    # User's date of birth for age verification and KYC.
    date_of_birth = models.DateField(_('date of birth'), null=True, blank=True)
    gender = models.CharField(_('gender'), max_length=20, choices=Gender.choices, null=True, blank=True)

    # Address fields for higher-tier KYC
    address_line_1 = models.CharField(_('address line 1'), max_length=255, blank=True)
    address_line_2 = models.CharField(_('address line 2'), max_length=255, blank=True)
    city = models.CharField(_('city'), max_length=100, blank=True)
    postal_code = models.CharField(_('postal code'), max_length=20, blank=True)
    country = models.CharField(_('country'), max_length=100, blank=True)

    # Tracks if the user has set up their transaction PIN.
    has_set_pin = models.BooleanField(default=False)

    # KYC (Know Your Customer) verification level.
    # This determines the user's transaction limits and access to features.
    verification_level = models.IntegerField(
        choices=VerificationLevels.choices,
        default=VerificationLevels.LEVEL_0
    )

    # Assign the custom manager to the `objects` attribute.
    objects = OviiUserManager()

    def __str__(self):
        """Returns the string representation of the user, which is their phone number."""
        return str(self.phone_number)

    def set_pin(self, raw_pin):
        """Hashes and sets the user's transaction PIN."""
        self.transaction_pin = make_password(raw_pin)
        self.has_set_pin = True
        self.save(update_fields=['transaction_pin', 'has_set_pin'])

    def check_pin(self, raw_pin):
        """Checks a raw PIN against the stored hash."""
        return check_password(raw_pin, self.transaction_pin)


class OTPRequest(models.Model):
    """
    Stores data for a single OTP request.
    """
    request_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone_number = PhoneNumberField()
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    expires_at = models.DateTimeField(editable=False)

    def save(self, *args, **kwargs):
        # self._state.adding is True only when the object is being created.
        if self._state.adding:
            # Set expiry to 5 minutes from now.
            self.expires_at = timezone.now() + timedelta(minutes=5)
        super().save(*args, **kwargs)

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"OTP for {self.phone_number} with id {self.request_id}"


class KYCDocument(models.Model):
    """
    Stores documents submitted by users for KYC verification.
    """
    class DocumentType(models.TextChoices):
        ID_CARD = 'ID_CARD', _('National ID Card')
        PASSPORT = 'PASSPORT', _('Passport')
        UTILITY_BILL = 'UTILITY_BILL', _('Utility Bill')

    user = models.ForeignKey(OviiUser, on_delete=models.CASCADE, related_name='kyc_documents')
    document_type = models.CharField(max_length=20, choices=DocumentType.choices)
    document_image = models.ImageField(upload_to='kyc_documents/')
    status = models.CharField(max_length=10, choices=DocumentStatus.choices, default=DocumentStatus.PENDING)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)