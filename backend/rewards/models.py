import uuid
from django.db import models


class RewardTip(models.Model):
    STATUS_CHOICES = [
        ('pending_review', 'Pending Officer Review'),
        ('forwarded', 'Forwarded to Detective'),
        ('rejected', 'Rejected'),
        ('confirmed', 'Confirmed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='reward_tips',
    )
    case = models.ForeignKey(
        'cases.Case',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reward_tips',
    )
    suspect = models.ForeignKey(
        'cases.Suspect',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reward_tips',
    )
    content = models.TextField()
    status = models.CharField(
        max_length=32,
        choices=STATUS_CHOICES,
        default='pending_review',
    )
    reviewed_by_officer = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='officer_reviewed_tips',
    )
    officer_reviewed_at = models.DateTimeField(null=True, blank=True)
    officer_notes = models.TextField(blank=True)
    forwarded_to_detective = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='forwarded_tips',
    )
    detective_reviewed_at = models.DateTimeField(null=True, blank=True)
    unique_code = models.CharField(max_length=64, unique=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Tip {self.id} ({self.status})"
