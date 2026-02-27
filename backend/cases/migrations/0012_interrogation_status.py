# Add interrogation_status to Interrogation
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cases', '0011_alter_interrogation_end_time_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='interrogation',
            name='interrogation_status',
            field=models.CharField(
                choices=[
                    ('pending_verification', 'Pending Captain Verify'),
                    ('pending_chief', 'Pending Chief (Critical)'),
                    ('verified', 'Verified'),
                    ('cancelled', 'Cancelled'),
                ],
                default='pending_verification',
                max_length=32,
            ),
        ),
    ]
