# Add Suspect role for suspect account matching
from django.db import migrations


def add_suspect_role(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    Role.objects.get_or_create(
        name='Suspect',
        defaults={
            'description': 'Suspect - can view and pay their assigned payments',
            'permissions': ['payments.suspect_access'],
        }
    )


def remove_suspect_role(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    Role.objects.filter(name='Suspect').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0008_person_national_id_user'),
    ]

    operations = [
        migrations.RunPython(add_suspect_role, remove_suspect_role),
    ]
