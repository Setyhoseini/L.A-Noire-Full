from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import CanAccessDetectiveBoard
from cases.models import Case
from evidence.models import Evidence
from .models import CaseBoard


@api_view(['GET'])
@permission_classes([IsAuthenticated, CanAccessDetectiveBoard])
def board_overview(request):
    """List open cases for board selection."""
    open_cases = Case.objects.filter(
        status__in=['new', 'open', 'investigation']
    ).order_by('-opened_at')[:50]

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
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, CanAccessDetectiveBoard])
def case_board_detail(request, case_id):
    """Get case evidences and board state (nodes, edges) for a case."""
    try:
        case = Case.objects.get(pk=case_id)
    except Case.DoesNotExist:
        return Response({'detail': 'Case not found'}, status=status.HTTP_404_NOT_FOUND)

    evidence = Evidence.objects.filter(case=case).order_by('-collected_at')
    board, _ = CaseBoard.objects.get_or_create(case=case, defaults={'nodes': [], 'edges': []})

    return Response({
        'case': {
            'id': str(case.id),
            'case_number': case.case_number,
            'title': case.title,
            'status': case.status,
        },
        'evidence': [
            {
                'id': str(e.id),
                'title': e.title,
                'evidence_type': e.evidence_type,
                'description': e.description or '',
            }
            for e in evidence
        ],
        'nodes': board.nodes,
        'edges': board.edges,
    }, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, CanAccessDetectiveBoard])
def case_board_save(request, case_id):
    """Save board state (nodes, edges) for a case."""
    try:
        case = Case.objects.get(pk=case_id)
    except Case.DoesNotExist:
        return Response({'detail': 'Case not found'}, status=status.HTTP_404_NOT_FOUND)

    board, _ = CaseBoard.objects.get_or_create(case=case, defaults={'nodes': [], 'edges': []})
    nodes = request.data.get('nodes', board.nodes)
    edges = request.data.get('edges', board.edges)

    if not isinstance(nodes, list):
        nodes = board.nodes
    if not isinstance(edges, list):
        edges = board.edges

    board.nodes = nodes
    board.edges = edges
    board.save()

    return Response({'nodes': board.nodes, 'edges': board.edges}, status=status.HTTP_200_OK)
