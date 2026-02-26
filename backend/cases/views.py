from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Case, CrimeReport
from .serializers import CaseSerializer, CrimeReportSerializer
from accounts.permissions import CanAccessCases


class CaseViewSet(viewsets.ModelViewSet):
    """Cases API. Role-based: Cadet, Officer, Detective, Sergeant, Captain, Chief, Complainant, Clerk."""
    queryset = Case.objects.all()
    serializer_class = CaseSerializer
    permission_classes = [IsAuthenticated, CanAccessCases]


class CrimeReportViewSet(viewsets.ModelViewSet):
    """Crime reports / complaints. Same role access as Cases."""
    queryset = CrimeReport.objects.all()
    serializer_class = CrimeReportSerializer
    permission_classes = [IsAuthenticated, CanAccessCases]

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)
