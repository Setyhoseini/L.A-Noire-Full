# Ensure permissions is never null - default to empty list
from django.db import migrations, models


def backfill_null_permissions(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    for role in Role.objects.all():
        if role.permissions is None:
            role.permissions = []
            role.save()


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_seed_role_permissions'),
    ]

    operations = [
        migrations.RunPython(backfill_null_permissions, noop),
        migrations.AlterField(
            model_name='role',
            name='permissions',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
