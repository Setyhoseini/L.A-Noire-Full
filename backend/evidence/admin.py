from django.contrib import admin

from .models import (
    Evidence,
    Testimony,
    BiologicalEvidence,
    VehicleEvidence,
    IdentificationEvidence,
    PhysicalEvidence,
    DigitalEvidence,
    PhotoEvidence,
    VideoEvidence,
)


@admin.register(Evidence)
class EvidenceAdmin(admin.ModelAdmin):
    list_display = ['title', 'evidence_type', 'status', 'case', 'collected_at']
    list_filter = ['evidence_type', 'status']
    search_fields = ['title', 'description']


@admin.register(Testimony)
class TestimonyAdmin(admin.ModelAdmin):
    list_display = ['evidence', 'witness', 'recorded_at']


@admin.register(BiologicalEvidence)
class BiologicalEvidenceAdmin(admin.ModelAdmin):
    list_display = ['evidence', 'review_status', 'reviewed_by', 'reviewed_at']
    list_filter = ['review_status']


@admin.register(VehicleEvidence)
class VehicleEvidenceAdmin(admin.ModelAdmin):
    list_display = ['evidence', 'model', 'license_plate', 'vin']


@admin.register(IdentificationEvidence)
class IdentificationEvidenceAdmin(admin.ModelAdmin):
    list_display = ['evidence', 'owner_name']


@admin.register(PhysicalEvidence)
class PhysicalEvidenceAdmin(admin.ModelAdmin):
    list_display = ['evidence', 'weight_grams', 'dimensions']


@admin.register(DigitalEvidence)
class DigitalEvidenceAdmin(admin.ModelAdmin):
    list_display = ['evidence', 'file_format', 'size_bytes']


@admin.register(PhotoEvidence)
class PhotoEvidenceAdmin(admin.ModelAdmin):
    list_display = ['evidence', 'resolution', 'width', 'height']


@admin.register(VideoEvidence)
class VideoEvidenceAdmin(admin.ModelAdmin):
    list_display = ['evidence', 'duration_seconds', 'codec']
