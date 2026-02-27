from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Evidence
from .serializers import EvidenceSerializer
from accounts.permissions import CanAccessEvidence


class EvidenceViewSet(viewsets.ModelViewSet):
    """Evidence API. Role-based: Detective, Officer, Coroner, Sergeant, Captain, Clerk."""
    queryset = Evidence.objects.all()
    serializer_class = EvidenceSerializer
    permission_classes = [IsAuthenticated, CanAccessEvidence]
