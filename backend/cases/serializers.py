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
    assigned_cadet_name = serializers.SerializerMethodField()

    class Meta:
        model = CrimeReport
        fields = [
            'id', 'title', 'description', 'occurred_at', 'location', 'witnesses',
            'status', 'created_at', 'case', 'assigned_cadet', 'assigned_cadet_name',
        ]
        read_only_fields = ['id', 'status', 'created_at', 'case', 'assigned_cadet']

    def get_assigned_cadet_name(self, obj):
        if obj.assigned_cadet:
            return obj.assigned_cadet.get_full_name() or obj.assigned_cadet.username
        return None


class DateOrDateTimeField(serializers.DateField):
    """DateField that accepts datetime values (coerces to date for output)."""

    def to_representation(self, value):
        if value is not None and hasattr(value, 'date'):
            value = value.date()
        return super().to_representation(value)


class SuspectSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source='person.full_name', read_only=True)
    case_number = serializers.CharField(source='case.case_number', read_only=True)
    start_date = DateOrDateTimeField(required=False)
    last_status_update = DateOrDateTimeField(required=False, allow_null=True)

    class Meta:
        model = Suspect
        fields = [
            'id', 'person', 'person_name', 'case', 'case_number', 'status',
            'start_date', 'last_status_update', 'crime_degree', 'days_under_pursuit',
        ]
        read_only_fields = ['id', 'days_under_pursuit']
