# Ensure accounts_person has national_id, user_id, photo - add if missing.
# Handles DB path mismatch or migration branches that skipped these columns.
from django.db import migrations


def ensure_person_columns(apps, schema_editor):
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("PRAGMA table_info(accounts_person)")
        columns = {row[1] for row in cursor.fetchall()}
        if 'national_id' not in columns:
            cursor.execute(
                "ALTER TABLE accounts_person ADD COLUMN national_id VARCHAR(32) NULL UNIQUE"
            )
        if 'user_id' not in columns:
            cursor.execute(
                "ALTER TABLE accounts_person ADD COLUMN user_id INTEGER NULL"
            )
        if 'photo' not in columns:
            cursor.execute(
                "ALTER TABLE accounts_person ADD COLUMN photo VARCHAR(255) NULL"
            )


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0012_merge_20260227_1728'),
    ]

    operations = [
        migrations.RunPython(ensure_person_columns, noop),
    ]
