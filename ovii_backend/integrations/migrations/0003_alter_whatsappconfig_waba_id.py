# Mirrors the migration generated ad-hoc on the production server so the
# migration graph matches environments where it was already applied.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("integrations", "0002_add_waba_id_and_template_tracking"),
    ]

    operations = [
        migrations.AlterField(
            model_name="whatsappconfig",
            name="waba_id",
            field=models.CharField(
                blank=True,
                help_text="WhatsApp Business Account ID (WABA ID) from Meta Business Manager. Required for template sync.",
                max_length=255,
                verbose_name="WhatsApp Business Account ID",
            ),
        ),
    ]
