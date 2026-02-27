# Add interrogation.access and interrogation.captain_verdict to Captain role
from django.db import migrations


def add_captain_interrogation_permissions(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    perms_to_add = ['interrogation.access', 'interrogation.captain_verdict']
    for name in ('Captain', 'captain'):
        try:
            role = Role.objects.get(name=name)
            existing = list(role.permissions or [])
            for p in perms_to_add:
                if p not in existing:
                    existing.append(p)
            role.permissions = existing
            role.save()
        except Role.DoesNotExist:
            pass


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0007_merge_20260226'),
    ]

    operations = [
        migrations.RunPython(add_captain_interrogation_permissions, noop),
    ]
