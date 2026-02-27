import uuid
from django.db import models


class BailPayment(models.Model):
    PAYMENT_TYPE_CHOICES = [
        ('bail', 'Bail'),
        ('fine', 'Fine'),
        ('punishment', 'Punishment'),
    ]
    STATUS_CHOICES = [
        ('pending_approval', 'Pending Sergeant Approval'),
        ('approved', 'Approved'),
        ('pending_payment', 'Pending Payment'),
        ('paid', 'Paid'),
        ('rejected', 'Rejected'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    suspect = models.ForeignKey(
        'cases.Suspect',
        on_delete=models.CASCADE,
        related_name='bail_payments',
    )
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    payment_type = models.CharField(
        max_length=16,
        choices=PAYMENT_TYPE_CHOICES,
        default='bail',
    )
    status = models.CharField(
        max_length=32,
        choices=STATUS_CHOICES,
        default='pending_approval',
    )
    sergeant = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='approved_bail_payments',
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    payment_gateway_ref = models.CharField(max_length=255, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    trial = models.ForeignKey(
        'trials.Trial',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='payments',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"BailPayment {self.id} ({self.status})"
