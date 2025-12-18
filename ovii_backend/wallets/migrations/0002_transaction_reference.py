# Generated migration for adding transaction_reference field
import uuid
from django.db import migrations, models


def generate_transaction_reference_for_existing(apps, schema_editor):
    """
    Generate transaction references for existing transactions.
    """
    Transaction = apps.get_model('wallets', 'Transaction')
    
    prefix_map = {
        'TRANSFER': 'TR',
        'WITHDRAWAL': 'CO',
        'PAYMENT': 'MP',
        'DEPOSIT': 'DP',
        'COMMISSION': 'CM',
    }
    
    for transaction in Transaction.objects.all():
        prefix = prefix_map.get(transaction.transaction_type, 'TR')
        unique_id = uuid.uuid4().hex[:8].upper()
        transaction_reference = f"{prefix}-{unique_id}"
        
        # Ensure uniqueness
        while Transaction.objects.filter(transaction_reference=transaction_reference).exists():
            unique_id = uuid.uuid4().hex[:8].upper()
            transaction_reference = f"{prefix}-{unique_id}"
        
        transaction.transaction_reference = transaction_reference
        transaction.save(update_fields=['transaction_reference'])


class Migration(migrations.Migration):

    dependencies = [
        ('wallets', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='transaction',
            name='transaction_reference',
            field=models.CharField(
                default='TR-00000000',
                editable=False,
                help_text='Unique transaction reference (e.g., TR-A1B2C3D4)',
                max_length=20,
                verbose_name='transaction reference'
            ),
            preserve_default=False,
        ),
        migrations.RunPython(
            generate_transaction_reference_for_existing,
            reverse_code=migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name='transaction',
            name='transaction_reference',
            field=models.CharField(
                editable=False,
                help_text='Unique transaction reference (e.g., TR-A1B2C3D4)',
                max_length=20,
                unique=True,
                verbose_name='transaction reference'
            ),
        ),
    ]
