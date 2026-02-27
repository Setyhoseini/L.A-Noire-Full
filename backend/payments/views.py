from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import _user_has_role
from .models import BailPayment
from .serializers import BailPaymentSerializer, BailPaymentCreateForVerdictSerializer
from trials.models import Trial


def _is_sergeant(user):
    return _user_has_role(user, ['sergeant'])


class BailPaymentViewSet(viewsets.ModelViewSet):
    """Bail, fine, and punishment payments. Sergeant creates and approves."""
    queryset = BailPayment.objects.select_related(
        'suspect', 'suspect__person', 'suspect__case', 'sergeant', 'trial'
    ).all()
    serializer_class = BailPaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if _is_sergeant(user):
            return qs
        # Suspect: only their own payments (via Person.user)
        if _user_has_role(user, ['suspect']):
            from accounts.models import Person, Suspect
            person = Person.objects.filter(user=user).first()
            if not person:
                return qs.none()
            suspect_ids = list(Suspect.objects.filter(person=person).values_list('id', flat=True))
            return qs.filter(suspect_id__in=suspect_ids)
        return qs.none()

    def perform_create(self, serializer):
        if not _is_sergeant(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only Sergeant can create bail/fine/punishment requests')
        serializer.save()

    def _check_eligibility(self, suspect):
        """Eligibility: crime_degree 2 or 3 for bail; level 3 criminals need sergeant approval."""
        cd = suspect.crime_degree
        if cd is None:
            return False, 'Suspect must have crime_degree set'
        if cd not in (2, 3):
            return False, 'Only crime levels 2 and 3 are eligible for bail/fine'
        return True, None

    @action(detail=False, methods=['post'], url_path='create-for-verdict')
    def create_for_verdict(self, request):
        """Sergeant creates punishment payment for a trial verdict."""
        if not _is_sergeant(request.user):
            return Response({'detail': 'Only Sergeant can create verdict payments'}, status=status.HTTP_403_FORBIDDEN)
        ser = BailPaymentCreateForVerdictSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            trial = Trial.objects.select_related('suspect').get(id=ser.validated_data['trial_id'])
        except Trial.DoesNotExist:
            return Response({'detail': 'Trial not found'}, status=status.HTTP_404_NOT_FOUND)
        if not trial.suspect:
            return Response(
                {'detail': 'Trial has no suspect linked'},
                status=status.HTTP_400_BAD_REQUEST
            )
        payment = BailPayment.objects.create(
            suspect=trial.suspect,
            amount=ser.validated_data['amount'],
            payment_type='punishment',
            trial=trial,
            status='pending_approval',
        )
        # Auto-approve since Sergeant created it
        payment.status = 'approved'
        payment.sergeant = request.user
        payment.approved_at = timezone.now()
        payment.save()
        return Response(BailPaymentSerializer(payment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Sergeant approves the bail/fine amount."""
        payment = self.get_object()
        if not _is_sergeant(request.user):
            return Response({'detail': 'Only Sergeant can approve'}, status=status.HTTP_403_FORBIDDEN)
        if payment.status != 'pending_approval':
            return Response(
                {'detail': 'Only pending payments can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Punishment payments skip crime_degree eligibility (set by Judge/Sergeant)
        if payment.payment_type != 'punishment':
            ok, err = self._check_eligibility(payment.suspect)
            if not ok:
                return Response({'detail': err}, status=status.HTTP_400_BAD_REQUEST)
        payment.status = 'approved'
        payment.sergeant = request.user
        payment.approved_at = timezone.now()
        payment.save()
        return Response(BailPaymentSerializer(payment).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def initiate_payment(self, request, pk=None):
        """Placeholder: returns mock payment URL. Payment gateway to be integrated later."""
        payment = self.get_object()
        if payment.status != 'approved':
            return Response(
                {'detail': 'Only approved payments can be paid'},
                status=status.HTTP_400_BAD_REQUEST
            )
        payment.status = 'pending_payment'
        payment.payment_gateway_ref = f'MOCK-{payment.id}'
        payment.save()
        return Response({
            'payment_url': f'/payments/placeholder/{payment.id}',
            'message': 'Payment gateway will be integrated. Reference: ' + payment.payment_gateway_ref,
            'reference': payment.payment_gateway_ref,
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def confirm_payment(self, request, pk=None):
        """Placeholder webhook: to be called by payment gateway later."""
        payment = self.get_object()
        if payment.status not in ('approved', 'pending_payment'):
            return Response(
                {'detail': 'Payment not in payable state'},
                status=status.HTTP_400_BAD_REQUEST
            )
        payment.status = 'paid'
        payment.paid_at = timezone.now()
        payment.save()
        # For bail/fine, mark suspect as released when paid; punishment may not imply release
        if payment.payment_type in ('bail', 'fine') and payment.suspect:
            payment.suspect.status = 'RELEASED'
            payment.suspect.save(update_fields=['status'])
        return Response(BailPaymentSerializer(payment).data, status=status.HTTP_200_OK)
