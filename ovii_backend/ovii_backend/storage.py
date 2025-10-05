"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-05-21
Description: Custom staticfiles storage to handle missing source map files.
"""

from whitenoise.storage import CompressedManifestStaticFilesStorage


class WhiteNoiseSilentStorage(CompressedManifestStaticFilesStorage):
    """
    A custom storage backend that inherits from WhiteNoise's storage but
    silences errors for missing source map files (.map).
    This is useful for packages like Jazzmin that reference .map files
    which don't actually exist.
    """
    def on_missing_file(self, path):
        if not path.endswith(".map"):
            super().on_missing_file(path)
