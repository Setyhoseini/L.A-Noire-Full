from rest_framework import serializers

from cases.models import Case, Report
from .models import Evidence


class EvidenceSerializer(serializers.ModelSerializer):
    case = serializers.PrimaryKeyRelatedField(
        queryset=Case.objects.all(),
        allow_null=True,
        required=False,
    )
    related_report = serializers.PrimaryKeyRelatedField(
        queryset=Report.objects.all(),
        allow_null=True,
        required=False,
    )

    class Meta:
        model = Evidence
        fields = [
            'id', 'title', 'description', 'evidence_type', 'collected_at',
            'storage_location', 'status', 'case', 'related_report',
        ]
        read_only_fields = ['id']

    def to_internal_value(self, data):
        # Normalize empty strings to None for optional FKs (frontend often sends '' for "no selection")
        if isinstance(data, dict):
            data = data.copy()
            for key in ('case', 'related_report'):
                if key in data and data[key] == '':
                    data[key] = None
        return super().to_internal_value(data)
