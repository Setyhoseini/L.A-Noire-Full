"""Show which database Django is using. Run: python manage.py show_db"""
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = "Show which database file Django is using"

    def handle(self, *args, **options):
        db_path = settings.DATABASES["default"]["NAME"]
        self.stdout.write(f"Database: {db_path}")
        import os
        if os.path.exists(db_path):
            self.stdout.write(self.style.SUCCESS("  (file exists)"))
        else:
            self.stdout.write(self.style.WARNING("  (file does not exist - run migrate)"))
