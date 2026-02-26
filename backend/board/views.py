from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import CanAccessDetectiveBoard
from cases.models import Case
from evidence.models import Evidence


@api_view(['GET'])
@permission_classes([IsAuthenticated, CanAccessDetectiveBoard])
def board_overview(request):
    """Detective Board: link evidence and documents to solve cases. Detective only."""
    open_cases = Case.objects.filter(
        status__in=['new', 'open', 'investigation']
    ).order_by('-opened_at')[:20]

    evidence = Evidence.objects.all().select_related('case').order_by('-collected_at')[:30]

    return Response({
        'cases': [
            {
                'id': str(c.id),
                'case_number': c.case_number,
                'title': c.title,
                'status': c.status,
            }
            for c in open_cases
        ],
        'evidence': [
            {
                'id': str(e.id),
                'title': e.title,
                'evidence_type': e.evidence_type,
                'case_id': str(e.case_id) if e.case_id else None,
            }
            for e in evidence
        ],
    }, status=status.HTTP_200_OK)
