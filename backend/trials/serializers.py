from rest_framework import serializers
from .models import Trial


class TrialCreateFromInterrogationSerializer(serializers.Serializer):
    """Create trial from verified interrogation."""
    interrogation_id = serializers.UUIDField()


class TrialSerializer(serializers.ModelSerializer):
    case_number = serializers.SerializerMethodField()
    suspect_name = serializers.SerializerMethodField()
    interrogation_id = serializers.SerializerMethodField()

    class Meta:
        model = Trial
        fields = [
            'id', 'interrogation', 'interrogation_id', 'case', 'case_number',
            'suspect', 'suspect_name',
            'start_date', 'end_date', 'verdict', 'verdict_details',
            'punishment_title', 'punishment_description', 'judge',
            'notes', 'court_room', 'witnesses',
        ]
        read_only_fields = ['id']

    def get_case_number(self, obj):
        return obj.case.case_number if obj.case else None

    def get_interrogation_id(self, obj):
        return str(obj.interrogation.id) if obj.interrogation else None

    def get_suspect_name(self, obj):
        if obj.suspect and obj.suspect.person:
            return obj.suspect.person.full_name()
        return None

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user:
            validated_data['judge'] = request.user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get('request')
        if request and request.user:
            validated_data['judge'] = request.user
        return super().update(instance, validated_data)
