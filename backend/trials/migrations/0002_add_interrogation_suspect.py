# Add interrogation FK only - suspect, verdict_details, punishment, judge already in 0002_trial_judge_and_more
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('trials', '0001_initial'),
        ('cases', '0012_crimereport_assigned_cadet'),
    ]

    operations = [
        migrations.AddField(
            model_name='trial',
            name='interrogation',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='trials',
                to='cases.interrogation',
            ),
        ),
    ]
