# Add interrogation permissions to Sergeant, Detective, Captain, Chief
from django.db import migrations


def add_interrogation_permissions(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    updates = {
        'Detective': ['interrogation.access'],
        'Sergeant': ['interrogation.access'],
        'Captain': ['interrogation.access', 'interrogation.captain_verdict'],
        'Chief': ['interrogation.chief_approve'],
    }
    for name, to_add in updates.items():
        try:
            role = Role.objects.get(name=name)
            perms = list(role.permissions or [])
            for p in to_add:
                if p not in perms:
                    perms.append(p)
            role.permissions = perms
            role.save()
        except Role.DoesNotExist:
            pass


def reverse_add(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    to_remove = {'interrogation.access', 'interrogation.captain_verdict', 'interrogation.chief_approve'}
    for role in Role.objects.all():
        perms = role.permissions or []
        role.permissions = [p for p in perms if p not in to_remove]
        role.save()


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0007_merge_20260226'),
    ]

    operations = [
        migrations.RunPython(add_interrogation_permissions, reverse_add),
    ]
