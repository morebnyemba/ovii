from django.apps import AppConfig


class UsersConfig(AppConfig):
    """
    App configuration for the 'users' app.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'