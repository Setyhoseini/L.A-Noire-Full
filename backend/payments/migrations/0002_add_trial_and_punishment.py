# Add trial FK and punishment payment type
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0001_bailpayment'),
        ('trials', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='bailpayment',
            name='trial',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='payments',
                to='trials.trial',
            ),
        ),
        migrations.AlterField(
            model_name='bailpayment',
            name='payment_type',
            field=models.CharField(
                choices=[('bail', 'Bail'), ('fine', 'Fine'), ('punishment', 'Punishment')],
                default='bail',
                max_length=16,
            ),
        ),
    ]
