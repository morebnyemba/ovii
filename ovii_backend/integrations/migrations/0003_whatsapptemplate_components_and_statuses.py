# Generated manually for template pull-from-Meta feature

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('integrations', '0002_add_waba_id_and_template_tracking'),
    ]

    operations = [
        migrations.AddField(
            model_name='whatsapptemplate',
            name='components',
            field=models.JSONField(
                blank=True,
                help_text='Template components (header/body/footer/buttons) as returned by Meta',
                null=True,
                verbose_name='Components',
            ),
        ),
        migrations.AlterField(
            model_name='whatsapptemplate',
            name='status',
            field=models.CharField(
                choices=[
                    ('PENDING', 'Pending'),
                    ('APPROVED', 'Approved'),
                    ('REJECTED', 'Rejected'),
                    ('DISABLED', 'Disabled'),
                    ('PAUSED', 'Paused'),
                    ('IN_APPEAL', 'In Appeal'),
                    ('PENDING_DELETION', 'Pending Deletion'),
                    ('DELETED', 'Deleted'),
                    ('LIMIT_EXCEEDED', 'Limit Exceeded'),
                ],
                default='PENDING',
                help_text='Template approval status in Meta',
                max_length=20,
                verbose_name='Status',
            ),
        ),
    ]
