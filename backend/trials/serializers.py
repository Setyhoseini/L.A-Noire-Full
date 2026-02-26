from rest_framework import serializers
from .models import Trial


class TrialSerializer(serializers.ModelSerializer):
    case_number = serializers.SerializerMethodField()

    class Meta:
        model = Trial
        fields = ['id', 'case', 'case_number', 'start_date', 'end_date', 'verdict', 'notes', 'court_room', 'witnesses']
        read_only_fields = ['id']

    def get_case_number(self, obj):
        return obj.case.case_number if obj.case else None
