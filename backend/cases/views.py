from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import DjangoModelPermissions
from .models import Case
from .serializers import CaseSerializer
from .permissions import CanAssignDetective, CanVerifyEvidence, CanIssueWarrant, CanCloseCase

class CaseViewSet(viewsets.ModelViewSet):
    queryset = Case.objects.all()
    serializer_class = CaseSerializer
    permission_classes = [DjangoModelPermissions]  # برای دسترسی‌های استاندارد

    @action(detail=True, methods=['post'], permission_classes=[CanAssignDetective])
    def assign_detective(self, request, pk=None):
        case = self.get_object()
        # منطق اختصاص کارآگاه
        return Response({'status': 'detective assigned'})

    @action(detail=True, methods=['post'], permission_classes=[CanVerifyEvidence])
    def verify_evidence(self, request, pk=None):
        case = self.get_object()
        # منطق تأیید شواهد
        return Response({'status': 'evidence verified'})

    # به همین ترتیب برای سایر اکشن‌ها