from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Trial
from .serializers import TrialSerializer, TrialCreateFromInterrogationSerializer
from accounts.permissions import CanAccessGeneralReport, _user_has_role
from cases.models import Interrogation


class TrialViewSet(viewsets.ModelViewSet):
    """Trials API. Judge creates trial from verified interrogation and sets verdict."""
    queryset = Trial.objects.select_related(
        'case', 'suspect', 'suspect__person', 'judge', 'interrogation'
    ).all()
    serializer_class = TrialSerializer
    permission_classes = [IsAuthenticated, CanAccessGeneralReport]

    def get_queryset(self):
        qs = super().get_queryset()
        case_id = self.request.query_params.get('case')
        if case_id:
            qs = qs.filter(case_id=case_id)
        return qs

    @action(detail=False, methods=['get'], url_path='verified-interrogations')
    def verified_interrogations(self, request):
        """List verified interrogations that don't have a trial yet. For Judge."""
        if not _user_has_role(request.user, ['judge', 'captain', 'chief']):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        ids_with_trials = Trial.objects.exclude(interrogation__isnull=True).values_list('interrogation_id', flat=True)
        verified = Interrogation.objects.filter(
            interrogation_status='verified'
        ).exclude(
            id__in=ids_with_trials
        ).select_related('case', 'suspect', 'suspect__person')
        return Response([
            {
                'id': str(i.id),
                'case_number': i.case.case_number if i.case else None,
                'suspect_name': i.suspect.person.full_name() if i.suspect and i.suspect.person else None,
                'suspect_id': str(i.suspect_id) if i.suspect_id else None,
                'case_id': str(i.case_id) if i.case_id else None,
            }
            for i in verified
        ])

    @action(detail=False, methods=['post'], url_path='create-from-interrogation')
    def create_from_interrogation(self, request):
        """Judge creates trial from verified interrogation."""
        if not _user_has_role(request.user, ['judge']):
            return Response({'detail': 'Only Judge can create trials from interrogations'}, status=status.HTTP_403_FORBIDDEN)
        ser = TrialCreateFromInterrogationSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            interrogation = Interrogation.objects.select_related('case', 'suspect').get(
                id=ser.validated_data['interrogation_id']
            )
        except Interrogation.DoesNotExist:
            return Response({'detail': 'Interrogation not found'}, status=status.HTTP_404_NOT_FOUND)
        if interrogation.interrogation_status != 'verified':
            return Response(
                {'detail': 'Only verified interrogations can be sent to trial'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if interrogation.trials.exists():
            return Response(
                {'detail': 'Trial already exists for this interrogation'},
                status=status.HTTP_400_BAD_REQUEST
            )
        trial = Trial.objects.create(
            interrogation=interrogation,
            case=interrogation.case,
            suspect=interrogation.suspect,
            start_date=timezone.now().date(),
            judge=request.user,
        )
        return Response(TrialSerializer(trial).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='set-verdict')
    def set_verdict(self, request, pk=None):
        """Judge sets verdict and punishment details."""
        trial = self.get_object()
        if not _user_has_role(request.user, ['judge']):
            return Response({'detail': 'Only Judge can set verdict'}, status=status.HTTP_403_FORBIDDEN)
        verdict = request.data.get('verdict')
        if verdict not in ['guilty', 'not_guilty', 'mistrial', 'other']:
            return Response(
                {'detail': 'verdict must be one of: guilty, not_guilty, mistrial, other'},
                status=status.HTTP_400_BAD_REQUEST
            )
        trial.verdict = verdict
        trial.verdict_details = request.data.get('verdict_details', '') or ''
        trial.punishment_title = request.data.get('punishment_title', '') or ''
        trial.punishment_description = request.data.get('punishment_description', '') or ''
        trial.judge = request.user
        trial.end_date = timezone.now().date()
        trial.save()
        return Response(TrialSerializer(trial).data, status=status.HTTP_200_OK)
