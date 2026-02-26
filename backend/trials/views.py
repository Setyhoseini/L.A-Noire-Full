from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Trial
from .serializers import TrialSerializer
from accounts.permissions import CanAccessGeneralReport


class TrialViewSet(viewsets.ReadOnlyModelViewSet):
    """Trials API. Role-based: Judge, Captain, Chief, Prosecutor (General Report roles)."""
    queryset = Trial.objects.all()
    serializer_class = TrialSerializer
    permission_classes = [IsAuthenticated, CanAccessGeneralReport]
