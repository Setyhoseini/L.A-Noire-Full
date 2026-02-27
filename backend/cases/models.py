import uuid
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser

class Case(models.Model):
    STATUS_CHOICES = [
        ('new', 'New'),
        ('open', 'Open'),
        ('investigation', 'Investigation'),
        ('closed', 'Closed'),
        ('cold', 'Cold'),
        ('archived', 'Archived'),
    ]
    PRIORITY_CHOICES = [('low', 'Low'), ('medium', 'Medium'), ('high', 'High')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case_number = models.CharField(max_length=64, unique=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='new')
    priority = models.CharField(max_length=16, choices=PRIORITY_CHOICES, default='medium')
    precinct = models.CharField(max_length=64, blank=True)
    opened_at = models.DateTimeField(default=timezone.now)
    closed_at = models.DateTimeField(null=True, blank=True)
    is_archived = models.BooleanField(default=False)
    crime_level = models.CharField(
        max_length=16,
        choices=[
            ('1', 'Level 1'),
            ('2', 'Level 2'),
            ('3', 'Level 3'),
            ('critical', 'Critical'),
        ],
        default='2',
    )
    assigned_detective = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='assigned_cases',
    )

    class Meta:
        ordering = ['-opened_at']
        permissions = [
            ("assign_detective", "اختصاص کارآگاه به پرونده"),
            ("verify_evidence", "تأیید شواهد پرونده"),
            ("issue_warrant", "صدور حکم جلب برای مظنون"),
            ("close_case", "بستن پرونده"),
            # هر دسترسی دیگری که نیاز دارید
        ]

    def __str__(self):
        return f"{self.case_number} - {self.title}"


class Report(models.Model):
    REPORT_TYPES = [
        ('complaint', 'Complaint'),
        ('patrol', 'Patrol Report'),
        ('forensic', 'Forensic Report'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report_type = models.CharField(max_length=32, choices=REPORT_TYPES, default='other')
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    case = models.ForeignKey('Case', null=True, blank=True, on_delete=models.SET_NULL, related_name='reports')

    def __str__(self):
        return f"{self.title} ({self.report_type})"
from rest_framework.permissions import BasePermission

class CanVerifyEvidence(BasePermission):
    def has_permission(self, request, view):
        return request.user.has_perm('cases.can_verify_evidence')   

class CrimeReport(models.Model):
    STATUS = [
        ('pending_superior', 'Pending Superior Approval'),
        ('approved', 'Approved'),
        ('returned', 'Returned'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    occurred_at = models.DateTimeField(null=True, blank=True)
    location = models.CharField(max_length=255, blank=True)
    witnesses = models.JSONField(null=True, blank=True)
    reporter = models.ForeignKey('accounts.User', null=True, blank=True, on_delete=models.SET_NULL, related_name='crime_reports')
    status = models.CharField(max_length=32, choices=STATUS, default='pending_superior')
    assigned_cadet = models.ForeignKey(
        'accounts.User', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='assigned_cadet_reports', help_text='Cadet assigned for initial triage'
    )
    assigned_superior = models.ForeignKey('accounts.User', null=True, blank=True, on_delete=models.SET_NULL, related_name='assigned_superior_reports')
    created_at = models.DateTimeField(default=timezone.now)
    attachments = models.ManyToManyField('cases.Attachment', blank=True, related_name='crime_report_attachments')
    case = models.ForeignKey('Case', null=True, blank=True, on_delete=models.SET_NULL, related_name='crime_reports')

    def __str__(self):
        return f"CrimeReport {self.id} - {self.title} ({self.status})"

    def log(self, actor_identifier, action, reason=None, details=None):
        AuditLog.objects.create(
             actor_identifier=actor_identifier,
             action=action,
             target_type='crime_report',
             target_id=str(self.id),
             details={'reason': reason, 'extra': details or {}},
        )

    def approve_by_superior(self, actor_identifier):
        self.status = 'approved'
        case = Case.objects.create(
            case_number=f"CASE-{uuid.uuid4().hex[:8].upper()}",
            title=self.title,
            description=self.description,
            status='open',
        )
        self.case = case
        self.log(actor_identifier, 'crime_report_approved', details={'case_number': case.case_number})
        self.save()

    def return_to_reporter(self, actor_identifier, reason=None):
        self.status = 'returned'
        self.log(actor_identifier, 'crime_report_returned', reason=reason)
        self.save()

class Attachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(upload_to='attachments/%Y/%m/%d', null=True, blank=True)
    filename = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(default=timezone.now)
    content_type = models.CharField(max_length=128, blank=True)
    note = models.TextField(blank=True)

    #Optional generic links (avoid User FK per request)
    case = models.ForeignKey('Case', null=True, blank=True, on_delete=models.SET_NULL, related_name='attachments')
    report = models.ForeignKey('Report', null=True, blank=True, on_delete=models.SET_NULL, related_name='attachments')
    evidence = models.ForeignKey('evidence.Evidence', null=True, blank=True, on_delete=models.SET_NULL, related_name='attachments')
    interrogation = models.ForeignKey('Interrogation', null=True, blank=True, on_delete=models.SET_NULL, related_name='attachments')

    def __str__(self):
        return self.filename or str(self.id)

class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor_identifier = models.CharField(max_length=128, blank=True)
    action = models.CharField(max_length=128)
    target_type = models.CharField(max_length=128, blank=True)
    target_id = models.CharField(max_length=128, blank=True)
    timestamp = models.DateTimeField(default=timezone.now)
    details = models.JSONField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.timestamp} - {self.actor_identifier} - {self.action}"
class Interrogation(models.Model):
    OUTCOME_CHOICES = [
        ('admitted', 'Admitted'),
        ('denied', 'Denied'),
        ('confession', 'Confession'),
        ('inconclusive', 'Inconclusive'),
        ('other', 'Other'),
    ]
    CAPTAIN_VERDICT_CHOICES = [
        ('pending', 'Pending'),
        ('guilty', 'Guilty'),
        ('suspected', 'Suspected'),
        ('cleared', 'Cleared'),
    ]
    INTERROGATION_STATUS_CHOICES = [
        ('pending_verification', 'Pending Captain Verify'),
        ('pending_chief', 'Pending Chief (Critical)'),
        ('verified', 'Verified'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey('Case', null=True, blank=True, on_delete=models.SET_NULL, related_name='interrogations')
    suspect = models.ForeignKey(
        'cases.Suspect',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='interrogations',
    )
    start_time = models.DateField(null=True, blank=True)
    end_time = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=255, blank=True)
    transcript = models.TextField(blank=True)
    outcome = models.CharField(max_length=32, choices=OUTCOME_CHOICES, default='other')
    notes = models.TextField(blank=True)
    attendees = models.ManyToManyField('accounts.Person', related_name='attended_interrogations', blank=True)
    guilt_score_sergeant = models.IntegerField(null=True, blank=True)
    guilt_score_detective = models.IntegerField(null=True, blank=True)
    sergeant = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='sergeant_interrogations',
    )
    detective = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='detective_interrogations',
    )
    captain_verdict = models.CharField(
        max_length=32,
        choices=CAPTAIN_VERDICT_CHOICES,
        default='pending',
    )
    captain = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='captain_interrogations',
    )
    chief_approved = models.BooleanField(null=True, blank=True)
    chief = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='chief_interrogations',
    )
    interrogation_status = models.CharField(
        max_length=32,
        choices=INTERROGATION_STATUS_CHOICES,
        default='pending_verification',
    )

    def __str__(self):
        suspect_str = str(self.suspect) if self.suspect else 'Unknown'
        return f"Interrogation for {suspect_str} on {self.start_time}"


