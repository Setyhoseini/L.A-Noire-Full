from rest_framework import serializers
from .models import RewardTip


class RewardTipSerializer(serializers.ModelSerializer):
    case_number = serializers.SerializerMethodField()
    suspect_name = serializers.SerializerMethodField()

    class Meta:
        model = RewardTip
        fields = [
            'id', 'user', 'case', 'case_number', 'suspect', 'suspect_name',
            'content', 'status', 'reviewed_by_officer', 'officer_reviewed_at',
            'officer_notes', 'forwarded_to_detective', 'detective_reviewed_at',
            'unique_code', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'user', 'status', 'unique_code', 'created_at', 'updated_at']

    def validate(self, attrs):
        # Convert empty strings to None for optional FKs (frontend may send "" when "None" selected)
        if attrs.get('case') == '':
            attrs['case'] = None
        if attrs.get('suspect') == '':
            attrs['suspect'] = None
        return attrs

    def get_case_number(self, obj):
        return obj.case.case_number if obj.case else None

    def get_suspect_name(self, obj):
        if obj.suspect and obj.suspect.person:
            return obj.suspect.person.full_name()
        return None
