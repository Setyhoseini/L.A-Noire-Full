from rest_framework import serializers
from .models import Trial


class TrialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trial
        fields = ['id', 'case', 'start_date', 'end_date', 'verdict', 'notes', 'court_room', 'witnesses']
        read_only_fields = ['id']
