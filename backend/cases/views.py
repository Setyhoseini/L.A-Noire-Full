from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import Person, Suspect
from .models import Case, CrimeReport
from .serializers import CaseSerializer, CrimeReportSerializer, PersonSerializer, SuspectSerializer
from accounts.permissions import CanAccessCases, CanApproveCrimeReports, CanAccessSurveillance


class CaseViewSet(viewsets.ModelViewSet):
    """Cases API. Role-based: Cadet, Officer, Detective, Sergeant, Captain, Chief, Complainant, Clerk."""
    queryset = Case.objects.all()
    serializer_class = CaseSerializer
    permission_classes = [IsAuthenticated, CanAccessCases]

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanAccessSurveillance])
    def add_suspect(self, request, pk=None):
        """Add a suspect to this case. POST with {person, status?, crime_degree?}."""
        case = self.get_object()
        person_id = request.data.get('person')
        if not person_id:
            return Response(
                {'detail': 'person (Person UUID) is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            Person.objects.get(pk=person_id)
        except Person.DoesNotExist:
            return Response(
                {'detail': 'Person not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        data = {
            'person': person_id,
            'case': str(case.id),
            'status': request.data.get('status', 'UNDER_PURSUIT'),
            'crime_degree': request.data.get('crime_degree'),
        }
        serializer = SuspectSerializer(data=data)
        if serializer.is_valid():
            suspect = serializer.save()
            return Response(SuspectSerializer(suspect).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CrimeReportViewSet(viewsets.ModelViewSet):
    """Crime reports / complaints. Same role access as Cases."""
    queryset = CrimeReport.objects.all()
    serializer_class = CrimeReportSerializer
    permission_classes = [IsAuthenticated, CanAccessCases]

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanApproveCrimeReports])
    def approve(self, request, pk=None):
        """Approve crime report; creates a case and links it."""
        report = self.get_object()
        if report.status != 'pending_superior':
            return Response(
                {'detail': 'Only pending reports can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        actor = str(request.user.id)
        report.approve_by_superior(actor)
        report.assigned_superior = request.user
        report.save()
        return Response(CrimeReportSerializer(report).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanApproveCrimeReports])
    def return_report(self, request, pk=None):
        """Return crime report to reporter with reason."""
        report = self.get_object()
        if report.status != 'pending_superior':
            return Response(
                {'detail': 'Only pending reports can be returned'},
                status=status.HTTP_400_BAD_REQUEST
            )
        reason = request.data.get('reason', '')
        actor = str(request.user.id)
        report.return_to_reporter(actor, reason=reason)
        return Response(CrimeReportSerializer(report).data, status=status.HTTP_200_OK)


class PersonViewSet(viewsets.ModelViewSet):
    """Person CRUD. For suspect management. Same access as Under Surveillance."""
    queryset = Person.objects.all()
    serializer_class = PersonSerializer
    permission_classes = [IsAuthenticated, CanAccessSurveillance]


class SuspectViewSet(viewsets.ModelViewSet):
    """Suspect CRUD. Link Person to Case with status, crime_degree."""
    queryset = Suspect.objects.select_related('person', 'case').all()
    serializer_class = SuspectSerializer
    permission_classes = [IsAuthenticated, CanAccessSurveillance]

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update suspect status (UNDER_PURSUIT, HOT_PURSUIT, CAPTURED, RELEASED)."""
        suspect = self.get_object()
        new_status = request.data.get('status')
        if new_status not in dict(Suspect.STATUS_CHOICES):
            return Response(
                {'detail': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        suspect.status = new_status
        from django.utils import timezone
        suspect.last_status_update = timezone.now().date()
        suspect.save()
        return Response(SuspectSerializer(suspect).data, status=status.HTTP_200_OK)
