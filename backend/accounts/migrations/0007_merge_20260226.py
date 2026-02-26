# Generated merge migration to resolve conflict between 0005_alter_user_role and 0006_role_permissions_default
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_alter_user_role'),
        ('accounts', '0006_role_permissions_default'),
    ]

    operations = [
    ]
