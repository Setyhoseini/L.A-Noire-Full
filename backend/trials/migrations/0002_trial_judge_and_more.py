# Trial: add suspect, verdict_details, punishment, judge
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('cases', '0013_interrogation_guilt_scores'),
        ('trials', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='trial',
            name='suspect',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='trials',
                to='cases.suspect',
            ),
        ),
        migrations.AddField(
            model_name='trial',
            name='verdict_details',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='trial',
            name='punishment_title',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='trial',
            name='punishment_description',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='trial',
            name='judge',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='judged_trials',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
