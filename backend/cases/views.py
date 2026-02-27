import random
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import Person, Suspect, User
from .models import Case, CrimeReport, Interrogation
from .serializers import (
    CaseSerializer,
    CrimeReportSerializer,
    InterrogationSerializer,
    PersonSerializer,
    SuspectSerializer,
)
from accounts.permissions import (
    CanAccessCases,
    CanApproveCrimeReports,
    CanAccessGeneralReport,
    CanAccessInterrogation,
    CanAccessSurveillance,
    CanChiefApprove,
    CanSubmitCaptainVerdict,
    CanSubmitCrimeReport,
    _user_has_role,
)
from evidence.models import Evidence


def _get_cadet_users():
    """Return active users with Cadet role (role CharField or roles M2M)."""
    from django.db.models import Q
    cadets = list(
        User.objects.filter(is_active=True)
        .filter(
            Q(role__iexact='cadet')
            | Q(roles__name__iexact='Cadet')
        )
        .distinct()
    )
    return cadets


class CaseViewSet(viewsets.ModelViewSet):
    """Cases API. Cadet, Officer, Detective, Sergeant, Captain, Chief, Complainant. Base user DENIED."""
    queryset = Case.objects.all()
    serializer_class = CaseSerializer
    permission_classes = [IsAuthenticated, CanAccessCases]

    @action(
        detail=True,
        methods=['get'],
        url_path='full-file',
        permission_classes=[IsAuthenticated, CanAccessGeneralReport],
    )
    def full_file(self, request, pk=None):
        """Assembled case file for Judge: case, reports, evidence, interrogations, officers, suspects."""
        case = self.get_object()
        crime_reports = list(
            case.crime_reports.select_related('reporter', 'assigned_cadet', 'assigned_superior').all()
        )
        interrogations = list(
            case.interrogations.select_related('suspect', 'suspect__person', 'sergeant', 'detective', 'captain', 'chief').all()
        )
        suspects = list(case.suspects.select_related('person').all())
        evidence = list(Evidence.objects.filter(case=case).all())
        officers = set()
        for r in crime_reports:
            if r.reporter_id:
                officers.add(r.reporter_id)
            if r.assigned_cadet_id:
                officers.add(r.assigned_cadet_id)
            if r.assigned_superior_id:
                officers.add(r.assigned_superior_id)
        for i in interrogations:
            if i.sergeant_id:
                officers.add(i.sergeant_id)
            if i.detective_id:
                officers.add(i.detective_id)
            if i.captain_id:
                officers.add(i.captain_id)
            if i.chief_id:
                officers.add(i.chief_id)
        from accounts.models import User
        officer_users = list(User.objects.filter(id__in=officers).values('id', 'username', 'first_name', 'last_name'))
        return Response({
            'case': CaseSerializer(case).data,
            'crime_reports': [
                {
                    'id': str(r.id),
                    'title': r.title,
                    'description': r.description,
                    'status': r.status,
                    'witnesses': r.witnesses,
                    'occurred_at': r.occurred_at.isoformat() if r.occurred_at else None,
                    'location': r.location,
                }
                for r in crime_reports
            ],
            'evidence': [
                {'id': str(e.id), 'title': e.title, 'evidence_type': e.evidence_type, 'status': e.status}
                for e in evidence
            ],
            'interrogations': [
                {
                    'id': str(i.id),
                    'suspect_name': i.suspect.person.full_name() if i.suspect and i.suspect.person else None,
                    'guilt_score_sergeant': i.guilt_score_sergeant,
                    'guilt_score_detective': i.guilt_score_detective,
                    'captain_verdict': i.captain_verdict,
                    'chief_approved': i.chief_approved,
                }
                for i in interrogations
            ],
            'officers': officer_users,
            'suspects': [
                {
                    'id': str(s.id),
                    'person_name': s.person.full_name() if s.person else None,
                    'status': s.status,
                    'crime_degree': s.crime_degree,
                }
                for s in suspects
            ],
        })

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
    """Crime reports / complaints. Base user can submit; Cadet receives for triage."""
    queryset = CrimeReport.objects.all()
    serializer_class = CrimeReportSerializer
    permission_classes = [IsAuthenticated, CanSubmitCrimeReport]

    def get_queryset(self):
        qs = CrimeReport.objects.all()
        user = self.request.user
        if not user or not user.is_authenticated:
            return qs.none()
        # Approvers see all
        if _user_has_role(user, ['sergeant', 'captain', 'chief', 'detective']):
            return qs
        # Base user only (no case roles): only their own reports
        if _user_has_role(user, ['base user']) and not _user_has_role(user, ['cadet', 'police officer', 'patrol officer', 'detective', 'sergeant', 'captain', 'chief', 'complainant']):
            return qs.filter(reporter=user)
        # Cadet: reports assigned to them or unassigned
        if _user_has_role(user, ['cadet']):
            from django.db.models import Q
            return qs.filter(Q(assigned_cadet=user) | Q(assigned_cadet__isnull=True))
        # Complainant, Police Officer, Patrol Officer: full list (or restrict as needed)
        return qs

    def perform_create(self, serializer):
        report = serializer.save(reporter=self.request.user)
        cadets = _get_cadet_users()
        if cadets:
            report.assigned_cadet = random.choice(cadets)
            report.save()

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

    def list(self, request, *args, **kwargs):
        from django.db import OperationalError
        try:
            return super().list(request, *args, **kwargs)
        except OperationalError as e:
            import logging
            logging.getLogger(__name__).warning('SuspectViewSet.list OperationalError: %s', e)
            return Response([], status=status.HTTP_200_OK)

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


class InterrogationViewSet(viewsets.ModelViewSet):
    """Interrogation CRUD. Sergeant/Detective submit guilt scores; Captain verdict; Chief approves for critical."""
    queryset = Interrogation.objects.select_related('case', 'suspect', 'suspect__person').all()
    serializer_class = InterrogationSerializer
    permission_classes = [IsAuthenticated, CanAccessInterrogation]

    def get_queryset(self):
        qs = super().get_queryset()
        case_id = self.request.query_params.get('case')
        suspect_id = self.request.query_params.get('suspect')
        verdict = self.request.query_params.get('verdict')
        if case_id:
            qs = qs.filter(case_id=case_id)
        if suspect_id:
            qs = qs.filter(suspect_id=suspect_id)
        if verdict:
            qs = qs.filter(captain_verdict=verdict)
        return qs

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanAccessInterrogation])
    def submit_guilt_score(self, request, pk=None):
        """Sergeant or Detective submits their guilt score (1-10)."""
        interrogation = self.get_object()
        user = request.user
        score = request.data.get('guilt_score')
        if score is None:
            return Response(
                {'detail': 'guilt_score (1-10) is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            score = int(score)
        except (TypeError, ValueError):
            return Response(
                {'detail': 'guilt_score must be an integer 1-10'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if score < 1 or score > 10:
            return Response(
                {'detail': 'guilt_score must be between 1 and 10'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if _user_has_role(user, ['sergeant']):
            interrogation.guilt_score_sergeant = score
            interrogation.sergeant = user
            interrogation.save(update_fields=['guilt_score_sergeant', 'sergeant'])
        elif _user_has_role(user, ['detective']):
            interrogation.guilt_score_detective = score
            interrogation.detective = user
            interrogation.save(update_fields=['guilt_score_detective', 'detective'])
        else:
            return Response(
                {'detail': 'Only Sergeant or Detective can submit guilt scores'},
                status=status.HTTP_403_FORBIDDEN
            )
        return Response(InterrogationSerializer(interrogation).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanSubmitCaptainVerdict])
    def submit_captain_verdict(self, request, pk=None):
        """Captain submits verdict. For critical cases, creates Chief approval task (chief_approved=None)."""
        interrogation = self.get_object()
        verdict = request.data.get('verdict')
        if verdict not in ['guilty', 'suspected', 'cleared']:
            return Response(
                {'detail': 'verdict must be one of: guilty, suspected, cleared'},
                status=status.HTTP_400_BAD_REQUEST
            )
        interrogation.captain_verdict = verdict
        interrogation.captain = request.user
        if interrogation.case and interrogation.case.crime_level == 'critical':
            interrogation.chief_approved = None  # Pending Chief approval
        else:
            interrogation.chief_approved = True  # Non-critical: auto-approved
        interrogation.save()
        return Response(InterrogationSerializer(interrogation).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanSubmitCaptainVerdict])
    def captain_verify(self, request, pk=None):
        """Captain verifies interrogation. For critical cases, Chief must also approve."""
        interrogation = self.get_object()
        if interrogation.interrogation_status not in ('pending_verification',):
            return Response(
                {'detail': 'Only pending verification interrogations can be verified'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if interrogation.case and interrogation.case.crime_level == 'critical':
            interrogation.interrogation_status = 'pending_chief'
        else:
            interrogation.interrogation_status = 'verified'
        interrogation.save(update_fields=['interrogation_status'])
        return Response(InterrogationSerializer(interrogation).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanSubmitCaptainVerdict])
    def captain_cancel(self, request, pk=None):
        """Captain cancels interrogation."""
        interrogation = self.get_object()
        if interrogation.interrogation_status not in ('pending_verification',):
            return Response(
                {'detail': 'Only pending verification interrogations can be cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        interrogation.interrogation_status = 'cancelled'
        interrogation.save(update_fields=['interrogation_status'])
        return Response(InterrogationSerializer(interrogation).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanChiefApprove])
    def chief_approve(self, request, pk=None):
        """Chief approves or rejects Captain verdict for critical cases only."""
        interrogation = self.get_object()
        if not interrogation.case or interrogation.case.crime_level != 'critical':
            return Response(
                {'detail': 'Chief approval only applies to critical-level cases'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if interrogation.interrogation_status != 'pending_chief':
            return Response(
                {'detail': 'Only pending chief interrogations can be approved/rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        approved = request.data.get('approved')
        if approved is None:
            return Response(
                {'detail': 'approved (true/false) is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        interrogation.chief_approved = bool(approved)
        interrogation.chief = request.user
        interrogation.interrogation_status = 'verified' if approved else 'cancelled'
        interrogation.save(update_fields=['chief_approved', 'chief', 'interrogation_status'])
        return Response(InterrogationSerializer(interrogation).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanChiefApprove])
    def chief_cancel(self, request, pk=None):
        """Chief cancels interrogation for critical cases."""
        interrogation = self.get_object()
        if not interrogation.case or interrogation.case.crime_level != 'critical':
            return Response(
                {'detail': 'Chief cancel only applies to critical-level cases'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if interrogation.interrogation_status != 'pending_chief':
            return Response(
                {'detail': 'Only pending chief interrogations can be cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        interrogation.chief_approved = False
        interrogation.chief = request.user
        interrogation.interrogation_status = 'cancelled'
        interrogation.save(update_fields=['chief_approved', 'chief', 'interrogation_status'])
        return Response(InterrogationSerializer(interrogation).data, status=status.HTTP_200_OK)
