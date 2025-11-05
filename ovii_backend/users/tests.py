from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.exceptions import ValidationError
from .models import OviiUser, FileSizeValidator

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
        with self.assertRaises(ValidationError):
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