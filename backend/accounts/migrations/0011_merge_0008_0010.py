# Merge migration to resolve conflict between 0008_add_captain_interrogation_permissions and 0010_merge_0009_conflict
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0008_add_captain_interrogation_permissions'),
        ('accounts', '0010_merge_0009_conflict'),
    ]

    operations = []
