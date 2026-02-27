# Create CaseBoard model for storing React Flow state per case
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('cases', '0012_crimereport_assigned_cadet'),
    ]

    operations = [
        migrations.CreateModel(
            name='CaseBoard',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nodes', models.JSONField(default=list)),
                ('edges', models.JSONField(default=list)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('case', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='board', to='cases.case')),
            ],
        ),
    ]
