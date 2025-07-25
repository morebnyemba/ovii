# Generated by Django 5.1.7 on 2025-07-12 22:22

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_otprequest_alter_oviiuser_managers_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='otprequest',
            name='email',
        ),
        migrations.AddField(
            model_name='otprequest',
            name='phone_number',
            field=models.CharField(default=django.utils.timezone.now, max_length=20),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='oviiuser',
            name='has_set_pin',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='oviiuser',
            name='transaction_pin',
            field=models.CharField(blank=True, max_length=128, verbose_name='transaction pin'),
        ),
        migrations.AddField(
            model_name='oviiuser',
            name='verification_level',
            field=models.IntegerField(choices=[(0, 'Unverified'), (1, 'Mobile Verified'), (2, 'Identity Verified'), (3, 'Address Verified')], default=0),
        ),
        migrations.AlterField(
            model_name='oviiuser',
            name='email',
            field=models.EmailField(blank=True, max_length=254, null=True, verbose_name='email address'),
        ),
        migrations.AlterField(
            model_name='oviiuser',
            name='phone_number',
            field=models.CharField(default=django.utils.timezone.now, max_length=20, unique=True, verbose_name='phone number'),
            preserve_default=False,
        ),
        migrations.CreateModel(
            name='KYCDocument',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('document_type', models.CharField(choices=[('ID_CARD', 'National ID Card'), ('PASSPORT', 'Passport'), ('UTILITY_BILL', 'Utility Bill')], max_length=20)),
                ('document_image', models.ImageField(upload_to='kyc_documents/')),
                ('status', models.CharField(choices=[('PENDING', 'Pending'), ('APPROVED', 'Approved'), ('REJECTED', 'Rejected')], default='PENDING', max_length=10)),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='kyc_documents', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
