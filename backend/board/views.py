from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import CanAccessDetectiveBoard


@api_view(['GET'])
@permission_classes([IsAuthenticated, CanAccessDetectiveBoard])
def board_overview(request):
    """Detective Board: link evidence and documents to solve cases. Detective only."""
    return Response({'items': [], 'message': 'Board data will be implemented'}, status=status.HTTP_200_OK)
