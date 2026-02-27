# Generated migration for Phase 1: Interrogation and Guilt Scores

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def migrate_suspect_to_suspect_entry(apps, schema_editor):
    """Migrate Interrogation.suspect from Person to Suspect."""
    Interrogation = apps.get_model('cases', 'Interrogation')
    Suspect = apps.get_model('cases', 'Suspect')
    for i in Interrogation.objects.select_related('case').filter(suspect_person__isnull=False):
        if i.case_id:
            suspect_entry = Suspect.objects.filter(
                person_id=i.suspect_person_id,
                case_id=i.case_id,
            ).first()
            if suspect_entry:
                i.suspect = suspect_entry
                i.save(update_fields=['suspect'])


def reverse_migrate(apps, schema_editor):
    """Reverse: set suspect_person from suspect.person."""
    Interrogation = apps.get_model('cases', 'Interrogation')
    for i in Interrogation.objects.select_related('suspect').filter(suspect__isnull=False):
        i.suspect_person_id = i.suspect.person_id
        i.save(update_fields=['suspect_person_id'])


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('cases', '0012_crimereport_assigned_cadet'),
    ]

    operations = [
        # Case: add crime_level, assigned_detective
        migrations.AddField(
            model_name='case',
            name='crime_level',
            field=models.CharField(
                choices=[
                    ('1', 'Level 1'),
                    ('2', 'Level 2'),
                    ('3', 'Level 3'),
                    ('critical', 'Critical'),
                ],
                default='2',
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name='case',
            name='assigned_detective',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='assigned_cases',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        # Interrogation: add new fields
        migrations.AddField(
            model_name='interrogation',
            name='guilt_score_sergeant',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='interrogation',
            name='guilt_score_detective',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='interrogation',
            name='sergeant',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='sergeant_interrogations',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name='interrogation',
            name='detective',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='detective_interrogations',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name='interrogation',
            name='captain_verdict',
            field=models.CharField(
                choices=[
                    ('pending', 'Pending'),
                    ('guilty', 'Guilty'),
                    ('suspected', 'Suspected'),
                    ('cleared', 'Cleared'),
                ],
                default='pending',
                max_length=32,
            ),
        ),
        migrations.AddField(
            model_name='interrogation',
            name='captain',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='captain_interrogations',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name='interrogation',
            name='chief_approved',
            field=models.BooleanField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='interrogation',
            name='chief',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='chief_interrogations',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        # Suspect FK change: rename old suspect to suspect_person, add new suspect FK to Suspect
        migrations.RenameField(
            model_name='interrogation',
            old_name='suspect',
            new_name='suspect_person',
        ),
        migrations.AddField(
            model_name='interrogation',
            name='suspect',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='interrogations',
                to='cases.suspect',
            ),
        ),
        migrations.RunPython(migrate_suspect_to_suspect_entry, reverse_migrate),
        migrations.RemoveField(
            model_name='interrogation',
            name='suspect_person',
        ),
    ]
