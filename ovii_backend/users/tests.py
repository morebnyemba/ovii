from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from .models import OviiUser, FileSizeValidator, Referral


class OviiUserModelTest(TestCase):
    def setUp(self):
        self.user_data = {
            "phone_number": "+263771234567",
            "email": "test@example.com",
            "first_name": "Test",
            "last_name": "User",
        }
        self.user = OviiUser.objects.create_user(**self.user_data)

    def test_email_uniqueness(self):
        # The database raises IntegrityError for unique constraint violations
        with self.assertRaises(IntegrityError):
            OviiUser.objects.create_user(
                phone_number="+263771234568",
                email="test@example.com",
                first_name="Another",
                last_name="User",
            )

    def test_profile_picture_allowed_extension(self):
        # Create a dummy PNG image
        image = SimpleUploadedFile("test.png", b"file_content", content_type="image/png")
        self.user.profile_picture = image
        self.user.full_clean()  # This will run validators
        self.user.save()
        self.assertTrue(self.user.profile_picture.name.endswith('.png'))

    def test_profile_picture_disallowed_extension(self):
        # Create a dummy GIF image
        image = SimpleUploadedFile("test.gif", b"file_content", content_type="image/gif")
        self.user.profile_picture = image
        with self.assertRaises(ValidationError):
            self.user.full_clean()

    def test_profile_picture_file_size_validator(self):
        # Create a dummy image larger than 2MB
        large_content = b'a' * (2 * 1024 * 1024 + 1)  # 2MB + 1 byte
        image = SimpleUploadedFile("large.png", large_content, content_type="image/png")
        self.user.profile_picture = image
        with self.assertRaises(ValidationError):
            self.user.full_clean()

    def test_file_size_validator_function(self):
        # Test the standalone validator function
        large_content = b'a' * (2 * 1024 * 1024 + 1)
        large_file = SimpleUploadedFile("test.png", large_content, content_type="image/png")
        with self.assertRaises(ValidationError):
            FileSizeValidator(large_file)

        small_content = b'a' * (1 * 1024 * 1024) # 1MB
        small_file = SimpleUploadedFile("test.png", small_content, content_type="image/png")
        # Should not raise an error
        try:
            FileSizeValidator(small_file)
        except ValidationError:
            self.fail("FileSizeValidator raised ValidationError unexpectedly for a small file.")


class ReferralCodeTest(TestCase):
    """Tests for the referral code functionality."""

    def setUp(self):
        self.user = OviiUser.objects.create_user(
            phone_number="+263771234567",
            first_name="Test",
            last_name="User",
        )

    def test_generate_referral_code(self):
        """Test that a referral code is generated correctly."""
        self.assertIsNone(self.user.referral_code)
        referral_code = self.user.generate_referral_code()
        self.assertIsNotNone(referral_code)
        self.assertEqual(len(referral_code), 8)
        # Refresh from database
        self.user.refresh_from_db()
        self.assertEqual(self.user.referral_code, referral_code)

    def test_generate_referral_code_idempotent(self):
        """Test that generating a referral code twice returns the same code."""
        code1 = self.user.generate_referral_code()
        code2 = self.user.generate_referral_code()
        self.assertEqual(code1, code2)

    def test_referral_code_uniqueness(self):
        """Test that referral codes are unique."""
        user2 = OviiUser.objects.create_user(
            phone_number="+263771234568",
            first_name="Test2",
            last_name="User2",
        )
        code1 = self.user.generate_referral_code()
        code2 = user2.generate_referral_code()
        self.assertNotEqual(code1, code2)


class ReferralModelTest(TestCase):
    """Tests for the Referral model."""

    def setUp(self):
        self.referrer = OviiUser.objects.create_user(
            phone_number="+263771234567",
            first_name="Referrer",
            last_name="User",
        )
        self.referrer.generate_referral_code()

        self.referred = OviiUser.objects.create_user(
            phone_number="+263771234568",
            first_name="Referred",
            last_name="User",
        )

    def test_create_referral(self):
        """Test creating a referral."""
        referral = Referral.objects.create(
            referrer=self.referrer,
            referred=self.referred,
            referral_code=self.referrer.referral_code,
        )
        self.assertEqual(referral.referrer, self.referrer)
        self.assertEqual(referral.referred, self.referred)
        self.assertEqual(referral.bonus_status, Referral.BonusStatus.PENDING)

    def test_referred_user_unique_constraint(self):
        """Test that a user can only be referred once."""
        Referral.objects.create(
            referrer=self.referrer,
            referred=self.referred,
            referral_code=self.referrer.referral_code,
        )
        # Create another referrer
        another_referrer = OviiUser.objects.create_user(
            phone_number="+263771234569",
            first_name="Another",
            last_name="Referrer",
        )
        another_referrer.generate_referral_code()

        # Should raise IntegrityError because the referred user already has a referral
        with self.assertRaises(IntegrityError):
            Referral.objects.create(
                referrer=another_referrer,
                referred=self.referred,
                referral_code=another_referrer.referral_code,
            )


class PINFunctionalityTest(TestCase):
    """Tests for the PIN functionality."""

    def setUp(self):
        self.user = OviiUser.objects.create_user(
            phone_number="+263771234567",
            first_name="Test",
            last_name="User",
        )

    def test_set_pin(self):
        """Test setting a transaction PIN."""
        self.assertFalse(self.user.has_set_pin)
        self.user.set_pin("1234")
        self.user.has_set_pin = True
        self.user.save()
        self.assertTrue(self.user.has_set_pin)

    def test_check_pin(self):
        """Test checking a transaction PIN."""
        self.user.set_pin("1234")
        self.assertTrue(self.user.check_pin("1234"))
        self.assertFalse(self.user.check_pin("4321"))

    def test_pin_is_hashed(self):
        """Test that PIN is stored as a hash, not plain text."""
        self.user.set_pin("1234")
        self.assertNotEqual(self.user.pin, "1234")
        self.assertTrue(len(self.user.pin) > 4)