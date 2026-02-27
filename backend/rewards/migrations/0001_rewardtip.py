import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('cases', '0013_interrogation_guilt_scores'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='RewardTip',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('content', models.TextField()),
                ('status', models.CharField(
                    choices=[
                        ('pending_review', 'Pending Officer Review'),
                        ('forwarded', 'Forwarded to Detective'),
                        ('rejected', 'Rejected'),
                        ('confirmed', 'Confirmed'),
                    ],
                    default='pending_review',
                    max_length=32,
                )),
                ('officer_reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('officer_notes', models.TextField(blank=True)),
                ('detective_reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('unique_code', models.CharField(blank=True, max_length=64, null=True, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('case', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='reward_tips',
                    to='cases.case',
                )),
                ('forwarded_to_detective', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='forwarded_tips',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('reviewed_by_officer', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='officer_reviewed_tips',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('suspect', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='reward_tips',
                    to='cases.suspect',
                )),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='reward_tips',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
