from rest_framework import serializers
from .models import Evidence


class EvidenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evidence
        fields = [
            'id', 'title', 'description', 'evidence_type', 'collected_at',
            'storage_location', 'status', 'case', 'related_report',
        ]
        read_only_fields = ['id']
