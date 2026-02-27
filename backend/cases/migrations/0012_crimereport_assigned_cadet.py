# Add assigned_cadet to CrimeReport - cadet receives submitted reports for triage
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('cases', '0011_alter_interrogation_end_time_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='crimereport',
            name='assigned_cadet',
            field=models.ForeignKey(
                blank=True,
                help_text='Cadet assigned for initial triage',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='assigned_cadet_reports',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
