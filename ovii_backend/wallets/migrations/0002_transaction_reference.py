# Generated migration for adding transaction_reference field
import uuid
from django.db import migrations, models


def generate_transaction_reference_for_existing(apps, schema_editor):
    """
    Generate transaction references for existing transactions.
    Uses bulk operations for better performance.
    """
    Transaction = apps.get_model('wallets', 'Transaction')
    
    prefix_map = {
        'TRANSFER': 'TR',
        'WITHDRAWAL': 'CO',
        'PAYMENT': 'MP',
        'DEPOSIT': 'DP',
        'COMMISSION': 'CM',
    }
    
    # Process transactions in batches for better performance
    batch_size = 500
    transactions = Transaction.objects.all()
    total = transactions.count()
    
    if total == 0:
        return  # No transactions to process
    
    # Generate unique references
    generated_refs = set()
    transactions_to_update = []
    
    for transaction in transactions.iterator(chunk_size=batch_size):
        prefix = prefix_map.get(transaction.transaction_type, 'TR')
        unique_id = uuid.uuid4().hex[:8].upper()
        transaction_reference = f"{prefix}-{unique_id}"
        
        # Ensure uniqueness within this batch
        while transaction_reference in generated_refs:
            unique_id = uuid.uuid4().hex[:8].upper()
            transaction_reference = f"{prefix}-{unique_id}"
        
        generated_refs.add(transaction_reference)
        transaction.transaction_reference = transaction_reference
        transactions_to_update.append(transaction)
        
        # Bulk update every batch_size transactions
        if len(transactions_to_update) >= batch_size:
            Transaction.objects.bulk_update(
                transactions_to_update, 
                ['transaction_reference'], 
                batch_size=batch_size
            )
            transactions_to_update = []
    
    # Update any remaining transactions
    if transactions_to_update:
        Transaction.objects.bulk_update(
            transactions_to_update, 
            ['transaction_reference'], 
            batch_size=batch_size
        )


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
