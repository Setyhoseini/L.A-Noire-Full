# Generated merge migration to resolve conflict between 0009_alter_user_extra_permissions and 0009_person_photo
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0009_alter_user_extra_permissions'),
        ('accounts', '0009_person_photo'),
    ]

    operations = []
