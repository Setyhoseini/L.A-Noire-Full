# No-op: national_id and user already added by 0008_person_national_id_user
# photo already added by 0009_person_photo. This migration exists for merge compatibility.
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0007_merge_20260226'),
    ]

    operations = []
