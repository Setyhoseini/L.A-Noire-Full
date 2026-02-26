from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import CanAccessSurveillance


@api_view(['GET'])
@permission_classes([IsAuthenticated, CanAccessSurveillance])
def payments_list(request):
    """Payments / rewards. Same roles as Under Surveillance."""
    return Response({'items': []}, status=status.HTTP_200_OK)
