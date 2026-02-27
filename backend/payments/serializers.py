from rest_framework import serializers
from .models import BailPayment


class BailPaymentSerializer(serializers.ModelSerializer):
    suspect_name = serializers.SerializerMethodField()
    case_number = serializers.SerializerMethodField()
    trial_id = serializers.SerializerMethodField()

    class Meta:
        model = BailPayment
        fields = [
            'id', 'suspect', 'suspect_name', 'case_number', 'trial', 'trial_id',
            'amount', 'payment_type', 'status',
            'sergeant', 'approved_at', 'payment_gateway_ref', 'paid_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'status', 'approved_at', 'paid_at', 'created_at', 'updated_at']

    def get_suspect_name(self, obj):
        if obj.suspect and obj.suspect.person:
            return obj.suspect.person.full_name()
        return None

    def get_case_number(self, obj):
        if obj.suspect and obj.suspect.case:
            return obj.suspect.case.case_number
        return None

    def get_trial_id(self, obj):
        return str(obj.trial.id) if obj.trial else None


class BailPaymentCreateForVerdictSerializer(serializers.Serializer):
    """Create punishment payment for a verdict."""
    trial_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=14, decimal_places=2)
