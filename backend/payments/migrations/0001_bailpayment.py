import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('cases', '0012_crimereport_assigned_cadet'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='BailPayment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=14)),
                ('payment_type', models.CharField(
                    choices=[('bail', 'Bail'), ('fine', 'Fine')],
                    default='bail',
                    max_length=16,
                )),
                ('status', models.CharField(
                    choices=[
                        ('pending_approval', 'Pending Sergeant Approval'),
                        ('approved', 'Approved'),
                        ('pending_payment', 'Pending Payment'),
                        ('paid', 'Paid'),
                        ('rejected', 'Rejected'),
                    ],
                    default='pending_approval',
                    max_length=32,
                )),
                ('approved_at', models.DateTimeField(blank=True, null=True)),
                ('payment_gateway_ref', models.CharField(blank=True, max_length=255)),
                ('paid_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('sergeant', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='approved_bail_payments',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('suspect', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='bail_payments',
                    to='cases.suspect',
                )),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
