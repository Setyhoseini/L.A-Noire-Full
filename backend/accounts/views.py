from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .serializers import UserSerializer, UserAdminSerializer, RegisterSerializer, ProfileUpdateSerializer
from .models import Role
from rest_framework import viewsets
from .serializers import RoleSerializer
from django.contrib.auth import get_user_model
from rest_framework.decorators import action
from rest_framework import status

from rest_framework.permissions import IsAuthenticated
from .permissions import IsAdminOrStaff
from .permission_codes import get_permissions_for_api

class ProfileView(generics.RetrieveUpdateAPIView):
    """GET: full profile. PATCH: update profile (first_name, last_name, phone_number, badge_number, rank, precinct)."""
    def get_serializer_class(self):
        if self.request.method == 'PATCH':
            return ProfileUpdateSerializer
        return UserSerializer

    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """POST: change password. Requires old_password and new_password."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        if not old_password or not new_password:
            return Response(
                {'detail': 'old_password and new_password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if len(new_password) < 7:
            return Response(
                {'detail': 'New password must be at least 7 characters'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user = request.user
        if not user.check_password(old_password):
            return Response(
                {'detail': 'Current password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Password updated successfully'}, status=status.HTTP_200_OK)
    
User = get_user_model()

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserAdminSerializer
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    @action(detail=True, methods=['post'])
    def assign_roles(self, request, pk=None):
        user = self.get_object()
        role_ids = request.data.get('role_ids', [])
        extra_permissions = request.data.get('extra_permissions', None)
        roles = Role.objects.filter(id__in=role_ids)
        user.roles.set(roles)
        if extra_permissions is not None:
            user.extra_permissions = list(extra_permissions) if isinstance(extra_permissions, (list, tuple)) else []
            user.save(update_fields=['extra_permissions'])
        else:
            user.save()
        return Response(UserAdminSerializer(user).data, status=status.HTTP_200_OK)


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, IsAdminOrStaff]

class RegisterView(generics.CreateAPIView):
    """User registration. Assigns 'Base user' role. Admin assigns other roles later."""
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_permissions(request):
    """List all available permission codes. Used by admin UI for role/user permission assignment."""
    return Response(get_permissions_for_api())


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Dashboard stats per PDF: solved cases, employees, active cases. Suspects get their payments."""
    from cases.models import Case
    from accounts.permissions import _user_has_role

    data = {
        'solved_cases': Case.objects.filter(status='closed').count(),
        'employees': User.objects.filter(is_active=True).count(),
        'active_cases': Case.objects.filter(status__in=['new', 'open', 'investigation']).count(),
    }
    if _user_has_role(request.user, ['suspect']):
        from accounts.models import Person, Suspect
        from payments.models import BailPayment
        person = Person.objects.filter(user=request.user).first()
        if person:
            suspect_ids = list(Suspect.objects.filter(person=person).values_list('id', flat=True))
            payments = BailPayment.objects.filter(
                suspect_id__in=suspect_ids
            ).exclude(status__in=['paid', 'rejected']).select_related('suspect', 'suspect__case')
            data['pending_payments'] = [
                {
                    'id': str(p.id),
                    'amount': str(p.amount),
                    'payment_type': p.payment_type,
                    'status': p.status,
                    'case_number': p.suspect.case.case_number if p.suspect and p.suspect.case else None,
                }
                for p in payments
            ]
        else:
            data['pending_payments'] = []
    return Response(data)