# Generated manually for template sync feature
# Date: 2024-12-16

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('integrations', '0001_initial'),
    ]

    operations = [
        # Add waba_id field to WhatsAppConfig
        migrations.AddField(
            model_name='whatsappconfig',
            name='waba_id',
            field=models.CharField(
                default='',
                help_text='WhatsApp Business Account ID (WABA ID) from Meta Business Manager',
                max_length=255,
                verbose_name='WhatsApp Business Account ID'
            ),
            preserve_default=False,
        ),
        # Create WhatsAppTemplate model
        migrations.CreateModel(
            name='WhatsAppTemplate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text='Unique name of the template', max_length=512, unique=True, verbose_name='Template Name')),
                ('category', models.CharField(help_text='Template category (AUTHENTICATION, MARKETING, UTILITY)', max_length=50, verbose_name='Category')),
                ('language', models.CharField(default='en', help_text='Template language code (e.g., en, en_US)', max_length=10, verbose_name='Language')),
                ('status', models.CharField(choices=[('PENDING', 'Pending'), ('APPROVED', 'Approved'), ('REJECTED', 'Rejected'), ('DISABLED', 'Disabled')], default='PENDING', help_text='Template approval status in Meta', max_length=20, verbose_name='Status')),
                ('template_id', models.CharField(blank=True, help_text='Template ID returned by Meta after creation', max_length=255, null=True, verbose_name='Meta Template ID')),
                ('last_synced_at', models.DateTimeField(blank=True, help_text='Last time this template was synced with Meta', null=True, verbose_name='Last Synced At')),
                ('rejection_reason', models.TextField(blank=True, help_text='Reason for rejection if template was rejected by Meta', verbose_name='Rejection Reason')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Updated At')),
            ],
            options={
                'verbose_name': 'WhatsApp Template',
                'verbose_name_plural': 'WhatsApp Templates',
                'ordering': ['-created_at'],
                'unique_together': {('name', 'language')},
            },
        ),
    ]
