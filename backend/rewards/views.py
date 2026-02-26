from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import Suspect
from accounts.permissions import CanAccessSurveillance


@api_view(['GET'])
@permission_classes([IsAuthenticated, CanAccessSurveillance])
def rewards_list(request):
    """Most Wanted / Under Surveillance. Suspects with status UNDER_PURSUIT or HOT_PURSUIT."""
    suspects = Suspect.objects.filter(
        status__in=['UNDER_PURSUIT', 'HOT_PURSUIT']
    ).select_related('person', 'case').order_by('-start_date')

    items = []
    for s in suspects:
        stats = s.person.compute_hot_pursuit_stats()
        items.append({
            'id': str(s.id),
            'person_id': str(s.person.id),
            'person_name': s.person.full_name(),
            'case_number': s.case.case_number if s.case else None,
            'status': s.status,
            'start_date': s.start_date.isoformat() if s.start_date else None,
            'days_under_pursuit': s.days_under_pursuit,
            'crime_degree': s.crime_degree,
            'rank': stats['rank'],
            'reward': stats['reward'],
            'cases': stats['cases'],
        })

    return Response({'items': items}, status=status.HTTP_200_OK)
