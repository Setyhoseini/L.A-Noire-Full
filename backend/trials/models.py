import uuid
from django.db import models


class Trial(models.Model):
    VERDICT_CHOICES = [
        ('guilty', 'Guilty'),
        ('not_guilty', 'Not Guilty'),
        ('mistrial', 'Mistrial'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    interrogation = models.ForeignKey(
        'cases.Interrogation',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='trials',
    )
    case = models.ForeignKey('cases.Case', on_delete=models.CASCADE, related_name='trials')
    suspect = models.ForeignKey(
        'cases.Suspect',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='trials',
    )
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    verdict = models.CharField(max_length=32, choices=VERDICT_CHOICES, default='other')
    verdict_details = models.TextField(blank=True)
    punishment_title = models.CharField(max_length=255, blank=True)
    punishment_description = models.TextField(blank=True)
    judge = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='judged_trials',
    )
    notes = models.TextField(blank=True)
    court_room = models.CharField(max_length=128, blank=True)
    witnesses = models.ManyToManyField('accounts.Person', related_name='trial_witnesses', blank=True)

    def __str__(self):
        return f"Trial for {self.case} ({self.start_date})"

