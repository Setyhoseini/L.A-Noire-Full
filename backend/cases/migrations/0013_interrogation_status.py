# Add interrogation_status for Captain verify/cancel and Chief approval flow
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cases', '0012_crimereport_assigned_cadet'),
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
