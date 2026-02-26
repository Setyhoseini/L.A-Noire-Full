import uuid
from django.db import models
from django.utils import timezone


class Evidence(models.Model):
    EVIDENCE_TYPES = [
        ('physical', 'Physical'),
        ('digital', 'Digital'),
        ('document', 'Document'),
        ('photo', 'Photo'),
        ('video', 'Video'),
        ('audio', 'Audio'),
        ('other', 'Other'),
    ]
    EVIDENCE_STATUS = [
        ('logged', 'Logged'),
        ('submitted', 'Submitted'),
        ('returned', 'Returned'),
        ('released', 'Released'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    evidence_type = models.CharField(max_length=32, choices=EVIDENCE_TYPES, default='other')
    file = models.FileField(upload_to='evidence/%Y/%m/%d', null=True, blank=True)
    collected_at = models.DateTimeField(null=True, blank=True)
    chain_of_custody = models.JSONField(null=True, blank=True)
    storage_location = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=32, choices=EVIDENCE_STATUS, default='logged')
    case = models.ForeignKey('cases.Case', null=True, blank=True, on_delete=models.SET_NULL, related_name='evidence')
    related_report = models.ForeignKey('cases.Report', null=True, blank=True, on_delete=models.SET_NULL, related_name='evidence')

    def __str__(self):
        return f"{self.title} ({self.evidence_type})"


class Testimony(models.Model):
    evidence = models.OneToOneField('Evidence', on_delete=models.CASCADE, related_name='testimony_detail')
    transcription = models.TextField(blank=True)
    witness = models.ForeignKey('accounts.Person', null=True, blank=True, on_delete=models.SET_NULL, related_name='testimonies')
    recorded_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Testimony for {self.evidence_id}"


class BiologicalEvidence(models.Model):
    REVIEW_STATUS = [('pending', 'Pending Coroner Review'), ('reviewed', 'Reviewed'), ('rejected', 'Rejected')]

    evidence = models.OneToOneField('Evidence', on_delete=models.CASCADE, related_name='biological_detail')
    biopsy_result = models.TextField(blank=True)
    reviewed_by = models.ForeignKey('accounts.User', null=True, blank=True, on_delete=models.SET_NULL, related_name='biological_reviews')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    images = models.ManyToManyField('cases.Attachment', blank=True, related_name='biological_images')
    review_status = models.CharField(max_length=32, choices=REVIEW_STATUS, default='pending')

    def mark_reviewed(self, reviewer, result_text, status='reviewed'):
        self.biopsy_result = result_text
        self.reviewed_by = reviewer
        self.reviewed_at = timezone.now()
        self.review_status = status
        self.save()

    def __str__(self):
        return f"BiologicalEvidence {self.evidence_id} ({self.review_status})"


class VehicleEvidence(models.Model):
    evidence = models.OneToOneField('Evidence', on_delete=models.CASCADE, related_name='vehicle_detail')
    model = models.CharField(max_length=128, blank=True)
    license_plate = models.CharField(max_length=64, blank=True)
    vin = models.CharField(max_length=128, blank=True)
    color = models.CharField(max_length=64, blank=True)

    def clean(self):
        # enforce business rule: at least one of license_plate or vin must be provided
        if not self.license_plate and not self.vin:
            raise ValueError('Either license_plate or vin must be provided')
        # optionally enforce not both? spec said cannot both be present; enforce mutually exclusive
        if self.license_plate and self.vin:
            raise ValueError('license_plate and vin cannot both be set')

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"VehicleEvidence {self.evidence_id} - {self.model}"


class IdentificationEvidence(models.Model):
    evidence = models.OneToOneField('Evidence', on_delete=models.CASCADE, related_name='identification_detail')
    key_value_pairs = models.JSONField(null=True, blank=True)
    owner_name = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"IdentificationEvidence {self.evidence_id}"


class PhysicalEvidence(models.Model):
    evidence = models.OneToOneField('Evidence', on_delete=models.CASCADE, related_name='physical_detail')
    weight_grams = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    dimensions = models.CharField(max_length=128, blank=True)


class DigitalEvidence(models.Model):
    evidence = models.OneToOneField('Evidence', on_delete=models.CASCADE, related_name='digital_detail')
    file_hash = models.CharField(max_length=255, blank=True)
    file_format = models.CharField(max_length=64, blank=True)
    size_bytes = models.BigIntegerField(null=True, blank=True)


class PhotoEvidence(models.Model):
    evidence = models.OneToOneField('Evidence', on_delete=models.CASCADE, related_name='photo_detail')
    resolution = models.CharField(max_length=64, blank=True)
    width = models.IntegerField(null=True, blank=True)
    height = models.IntegerField(null=True, blank=True)


class VideoEvidence(models.Model):
    evidence = models.OneToOneField('Evidence', on_delete=models.CASCADE, related_name='video_detail')
    duration_seconds = models.FloatField(null=True, blank=True)
    codec = models.CharField(max_length=128, blank=True)

