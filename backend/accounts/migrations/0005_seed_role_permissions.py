# Seed Role.permissions per PDF - predefined permissions for each role
# Permission codes: cases.access, cases.approve_reports, board.access,
# surveillance.access, general_report.access, evidence.access, admin.access
from django.db import migrations


# Role name -> list of permission codes (exactly as PDF describes)
ROLE_PERMISSIONS = {
    'Administrator': ['admin.access'],
    'admin': ['admin.access'],
    'Cadet': ['cases.access'],
    'Police Officer': ['cases.access', 'surveillance.access', 'evidence.access'],
    'Patrol Officer': ['cases.access', 'surveillance.access', 'evidence.access'],
    'Detective': [
        'cases.access',
        'board.access',
        'surveillance.access',
        'evidence.access',
        'cases.approve_reports',
    ],
    'Sergeant': [
        'cases.access',
        'surveillance.access',
        'evidence.access',
        'cases.approve_reports',
    ],
    'Captain': [
        'cases.access',
        'surveillance.access',
        'evidence.access',
        'general_report.access',
        'cases.approve_reports',
    ],
    'Chief': [
        'cases.access',
        'surveillance.access',
        'general_report.access',
        'cases.approve_reports',
    ],  # Evidence: Detective, Police Officer, Patrol Officer, Coroner, Sergeant, Captain only (Chief not in PDF)
    'Complainant': ['cases.access'],
    'Coroner': ['evidence.access'],
    'Judge': ['general_report.access'],
    'Base user': [],  # Default for new registrations - no special permissions
}


def seed_permissions(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    for name, perms in ROLE_PERMISSIONS.items():
        try:
            role = Role.objects.get(name=name)
            role.permissions = perms
            role.save()
        except Role.DoesNotExist:
            pass  # Role may not exist yet; skip


def reverse_seed(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    for name in ROLE_PERMISSIONS:
        try:
            role = Role.objects.get(name=name)
            role.permissions = None
            role.save()
        except Role.DoesNotExist:
            pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_merge_20260226'),
    ]

    operations = [
        migrations.RunPython(seed_permissions, reverse_seed),
    ]
