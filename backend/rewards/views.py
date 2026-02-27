import secrets
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import Suspect, User
from accounts.permissions import _user_has_role
from .models import RewardTip
from .serializers import RewardTipSerializer


def _is_police_role(user):
    return _user_has_role(user, [
        'cadet', 'police officer', 'patrol officer', 'detective',
        'sergeant', 'captain', 'chief',
    ])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def rewards_list(request):
    """Most Wanted / Under Surveillance. Visible to all authenticated users."""
    from django.db import OperationalError
    try:
        # Update UNDER_PURSUIT > 30 days to HOT_PURSUIT
        for s in Suspect.objects.filter(status='UNDER_PURSUIT'):
            s.update_status_if_expired(30)

        suspects = Suspect.objects.filter(
            status__in=['UNDER_PURSUIT', 'HOT_PURSUIT']
        ).select_related('person', 'case').order_by('-start_date')

        items = []
        for s in suspects:
            stats = s.person.compute_hot_pursuit_stats()
            photo_url = None
            if s.person.photo:
                photo_url = request.build_absolute_uri(s.person.photo.url)
            items.append({
                'id': str(s.id),
                'person_id': str(s.person.id),
                'person_name': s.person.full_name(),
                'photo_url': photo_url,
                'case_number': s.case.case_number if s.case else None,
                'status': s.status,
                'start_date': s.start_date.isoformat() if s.start_date else None,
                'days_under_pursuit': s.days_under_pursuit,
                'crime_degree': s.crime_degree,
                'rank': stats['rank'],
                'reward': stats['reward'],
                'cases': stats['cases'],
            })

        # Sort by rank descending
        items.sort(key=lambda x: x['rank'], reverse=True)

        return Response({'items': items}, status=status.HTTP_200_OK)
    except OperationalError as e:
        # Schema mismatch or missing tables - return empty; run: python manage.py migrate
        import logging
        logging.getLogger(__name__).warning('rewards_list OperationalError: %s', e)
        return Response({'items': []}, status=status.HTTP_200_OK)
    except Exception as e:
        import logging
        logging.getLogger(__name__).exception('rewards_list error: %s', e)
        raise


class RewardTipViewSet(viewsets.ModelViewSet):
    """Reward tips: submit, officer review, detective confirm."""
    queryset = RewardTip.objects.select_related('user', 'case', 'suspect', 'suspect__person').all()
    serializer_class = RewardTipSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        from django.db import OperationalError
        try:
            return super().list(request, *args, **kwargs)
        except OperationalError as e:
            import logging
            logging.getLogger(__name__).warning('RewardTipViewSet.list OperationalError: %s', e)
            return Response([], status=status.HTTP_200_OK)

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        scope = self.request.query_params.get('scope')
        if scope == 'mine':
            return qs.filter(user=user)
        if _user_has_role(user, ['police officer', 'patrol officer']):
            return qs.filter(status='pending_review')
        if _user_has_role(user, ['detective']):
            return qs.filter(status='forwarded', forwarded_to_detective=user)
        return qs.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def officer_review(self, request, pk=None):
        """Officer rejects or forwards tip to detective."""
        tip = self.get_object()
        if tip.status != 'pending_review':
            return Response(
                {'detail': 'Only pending tips can be reviewed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not _user_has_role(request.user, ['police officer', 'patrol officer']):
            return Response({'detail': 'Only officers can review'}, status=status.HTTP_403_FORBIDDEN)
        action_type = request.data.get('action')
        if action_type == 'reject':
            tip.status = 'rejected'
            tip.reviewed_by_officer = request.user
            tip.officer_reviewed_at = timezone.now()
            tip.officer_notes = request.data.get('notes', '')
            tip.save()
        elif action_type == 'forward':
            detective_id = request.data.get('detective')
            if not detective_id and tip.case and tip.case.assigned_detective_id:
                detective_id = str(tip.case.assigned_detective_id)
            if not detective_id:
                return Response(
                    {'detail': 'detective (user id) required when forwarding, or assign detective to case'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            try:
                detective = User.objects.get(pk=detective_id)
            except User.DoesNotExist:
                return Response({'detail': 'Detective not found'}, status=status.HTTP_404_NOT_FOUND)
            if not _user_has_role(detective, ['detective']):
                return Response(
                    {'detail': 'Target must be a detective'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            tip.status = 'forwarded'
            tip.reviewed_by_officer = request.user
            tip.officer_reviewed_at = timezone.now()
            tip.officer_notes = request.data.get('notes', '')
            tip.forwarded_to_detective = detective
            tip.save()
        else:
            return Response(
                {'detail': 'action must be reject or forward'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return Response(RewardTipSerializer(tip).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def detective_confirm(self, request, pk=None):
        """Detective confirms tip and generates unique code."""
        tip = self.get_object()
        if tip.status != 'forwarded':
            return Response(
                {'detail': 'Only forwarded tips can be confirmed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if tip.forwarded_to_detective_id != request.user.id:
            return Response({'detail': 'Only assigned detective can confirm'}, status=status.HTTP_403_FORBIDDEN)
        tip.status = 'confirmed'
        tip.detective_reviewed_at = timezone.now()
        tip.unique_code = secrets.token_hex(8).upper()
        tip.save()
        return Response(RewardTipSerializer(tip).data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def detectives_list(request):
    """List detectives for officer forward dropdown."""
    if not _user_has_role(request.user, ['police officer', 'patrol officer']):
        return Response({'detail': 'Officers only'}, status=status.HTTP_403_FORBIDDEN)
    from django.db.models import Q
    detectives = User.objects.filter(is_active=True).filter(
        Q(role__iexact='detective') | Q(roles__name__iexact='Detective')
    ).distinct().values('id', 'username', 'first_name', 'last_name')
    return Response(list(detectives), status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reward_lookup(request):
    """Police lookup: national_id + unique_code -> reward amount and user info."""
    if not _is_police_role(request.user):
        return Response({'detail': 'Police roles only'}, status=status.HTTP_403_FORBIDDEN)
    national_id = request.data.get('national_id')
    unique_code = request.data.get('unique_code')
    if not national_id or not unique_code:
        return Response(
            {'detail': 'national_id and unique_code required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    tip = RewardTip.objects.filter(
        unique_code=unique_code,
        user__national_id=national_id,
        status='confirmed',
    ).select_related('user', 'case', 'suspect').first()
    if not tip:
        return Response(
            {'detail': 'No matching reward found'},
            status=status.HTTP_404_NOT_FOUND
        )
    reward = 0
    if tip.suspect:
        reward = tip.suspect.person.compute_hot_pursuit_stats().get('reward', 0)
    return Response({
        'reward': reward,
        'user': {
            'first_name': tip.user.first_name,
            'last_name': tip.user.last_name,
            'national_id': tip.user.national_id,
        },
        'unique_code': tip.unique_code,
    }, status=status.HTTP_200_OK)
