# Fix Suspect.start_date default: use date instead of datetime
from django.db import migrations, models
from django.utils import timezone


def _today_date():
    return timezone.now().date()


class Migration(migrations.Migration):

    dependencies = [
        ('cases', '0009_alter_case_options'),
    ]

    operations = [
        migrations.AlterField(
            model_name='suspect',
            name='start_date',
            field=models.DateField(default=_today_date),
        ),
    ]
