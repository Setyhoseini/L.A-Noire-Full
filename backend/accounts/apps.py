from django.apps import AppConfig


def _ensure_person_schema():
    """Add national_id, user_id, photo to accounts_person if missing. Handles DB path mismatch."""
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


class AccountsConfig(AppConfig):
    name = 'accounts'

    def ready(self):
        import sys
        if any(cmd in sys.argv for cmd in ('migrate', 'makemigrations')):
            return
        try:
            _ensure_person_schema()
        except Exception:
            pass  # Migrations not applied yet, or non-SQLite
