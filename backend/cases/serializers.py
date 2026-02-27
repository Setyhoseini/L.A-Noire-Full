import uuid
from rest_framework import serializers
from accounts.models import Person, Suspect
from .models import Case, CrimeReport, Interrogation


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
            'crime_level', 'assigned_detective',
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
    person_name = serializers.SerializerMethodField()

    def get_person_name(self, obj):
        return obj.person.full_name() if obj.person else None
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


class InterrogationSerializer(serializers.ModelSerializer):
    suspect_name = serializers.SerializerMethodField()
    case_number = serializers.CharField(source='case.case_number', read_only=True)
    crime_level = serializers.CharField(source='case.crime_level', read_only=True)

    class Meta:
        model = Interrogation
        fields = [
            'id', 'case', 'case_number', 'suspect', 'suspect_name', 'crime_level',
            'start_time', 'end_time', 'location', 'transcript', 'outcome', 'notes',
            'guilt_score_sergeant', 'guilt_score_detective', 'sergeant', 'detective',
            'captain_verdict', 'captain', 'chief_approved', 'chief',
            'interrogation_status',
        ]
        read_only_fields = ['id']

    def get_suspect_name(self, obj):
        if obj.suspect and obj.suspect.person:
            return obj.suspect.person.full_name()
        return None

    def validate_guilt_score(self, value):
        if value is not None and (value < 1 or value > 10):
            raise serializers.ValidationError('Guilt score must be between 1 and 10.')
        return value

    def validate_guilt_score_sergeant(self, value):
        return self.validate_guilt_score(value)

    def validate_guilt_score_detective(self, value):
        return self.validate_guilt_score(value)
