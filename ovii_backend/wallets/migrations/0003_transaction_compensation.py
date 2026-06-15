from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('wallets', '0002_transaction_reference'),
    ]

    operations = [
        # Add the COMPENSATION choice to the transaction_type field.
        migrations.AlterField(
            model_name='transaction',
            name='transaction_type',
            field=models.CharField(
                choices=[
                    ('TRANSFER', 'Transfer'),
                    ('DEPOSIT', 'Deposit'),
                    ('WITHDRAWAL', 'Withdrawal'),
                    ('PAYMENT', 'Payment'),
                    ('COMMISSION', 'Commission'),
                    ('COMPENSATION', 'Compensation'),
                ],
                default='TRANSFER',
                max_length=20,
                verbose_name='transaction type',
            ),
        ),
        # Add the self-referential FK for compensation transactions.
        migrations.AddField(
            model_name='transaction',
            name='compensates',
            field=models.ForeignKey(
                blank=True,
                help_text='The original transaction this compensation reverses.',
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='compensation_transactions',
                to='wallets.transaction',
            ),
        ),
    ]
