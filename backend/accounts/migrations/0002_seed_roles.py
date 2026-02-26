# Data migration: Seed all PDF roles for RBAC with permissions
from django.db import migrations


# Role name -> (description, permissions list) - permissions per PDF
ROLES_WITH_PERMISSIONS = [
    ('Administrator', 'System administrator with full access', ['admin.access']),
    ('admin', 'Admin panel access', ['admin.access']),
    ('Cadet', 'Cadet - Cases & Complaints', ['cases.access']),
    ('Police Officer', 'Police officer - Cases, Surveillance, Evidence', ['cases.access', 'surveillance.access', 'evidence.access']),
    ('Patrol Officer', 'Patrol officer - Cases, Surveillance, Evidence', ['cases.access', 'surveillance.access', 'evidence.access']),
    ('Detective', 'Detective - Cases, Board, Surveillance, Evidence, Approve reports', ['cases.access', 'board.access', 'surveillance.access', 'evidence.access', 'cases.approve_reports']),
    ('Sergeant', 'Sergeant - Cases, Surveillance, Evidence, Approve reports', ['cases.access', 'surveillance.access', 'evidence.access', 'cases.approve_reports']),
    ('Captain', 'Captain - Cases, Surveillance, Evidence, General Report, Approve reports', ['cases.access', 'surveillance.access', 'evidence.access', 'general_report.access', 'cases.approve_reports']),
    ('Chief', 'Chief - Cases, Surveillance, General Report, Approve reports', ['cases.access', 'surveillance.access', 'general_report.access', 'cases.approve_reports']),
    ('Complainant', 'Complainant - Cases & Complaints', ['cases.access']),
    ('Coroner', 'Coroner - Evidence', ['evidence.access']),
    ('Judge', 'Judge - General Report', ['general_report.access']),
    ('Base user', 'Default role for new registrations', []),
]


def seed_roles(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    for name, description, permissions in ROLES_WITH_PERMISSIONS:
        Role.objects.get_or_create(name=name, defaults={'description': description, 'permissions': permissions})


def reverse_seed(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    names = [r[0] for r in ROLES_WITH_PERMISSIONS]
    Role.objects.filter(name__in=names).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_roles, reverse_seed),
    ]
