# Remove roles not in PDF: Officer, Clerk, Prosecutor
from django.db import migrations


def remove_roles(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    Role.objects.filter(name__in=['Officer', 'Clerk', 'Prosecutor', 'officer', 'clerk', 'prosecutor']).delete()


def reverse_remove(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    for name, desc in [
        ('Officer', 'Officer - Cases, Surveillance, Evidence'),
        ('Clerk', 'Clerk - Cases, Evidence'),
        ('Prosecutor', 'Prosecutor - General Report'),
    ]:
        Role.objects.get_or_create(name=name, defaults={'description': desc})


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_seed_roles'),
    ]

    operations = [
        migrations.RunPython(remove_roles, reverse_remove),
    ]
