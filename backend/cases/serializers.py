import uuid
from rest_framework import serializers
from accounts.models import Person, Suspect
from .models import Case, CrimeReport


class PersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = [
            'id', 'first_name', 'last_name', 'dob', 'aliases', 'contact_info',
            'person_type', 'notes', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


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


class SuspectSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source='person.full_name', read_only=True)
    case_number = serializers.CharField(source='case.case_number', read_only=True)

    class Meta:
        model = Suspect
        fields = [
            'id', 'person', 'person_name', 'case', 'case_number', 'status',
            'start_date', 'last_status_update', 'crime_degree', 'days_under_pursuit',
        ]
        read_only_fields = ['id', 'days_under_pursuit']
