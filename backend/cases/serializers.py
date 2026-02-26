import uuid
from rest_framework import serializers
from .models import Case, CrimeReport


class CaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Case
        fields = [
            'id', 'case_number', 'title', 'description', 'status', 'priority',
            'precinct', 'opened_at', 'closed_at', 'is_archived',
        ]
        read_only_fields = ['id', 'case_number', 'opened_at', 'closed_at']

    def create(self, validated_data):
        validated_data['case_number'] = f"CASE-{uuid.uuid4().hex[:8].upper()}"
        return super().create(validated_data)


class CrimeReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = CrimeReport
        fields = [
            'id', 'title', 'description', 'occurred_at', 'location', 'witnesses',
            'status', 'created_at', 'case',
        ]
        read_only_fields = ['id', 'status', 'created_at', 'case']
