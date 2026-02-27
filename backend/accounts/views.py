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
    """Dashboard stats per PDF: solved cases, employees, active cases."""
    from cases.models import Case

    solved = Case.objects.filter(status='closed').count()
    employees = User.objects.filter(is_active=True).count()
    active = Case.objects.filter(status__in=['new', 'open', 'investigation']).count()

    return Response({
        'solved_cases': solved,
        'employees': employees,
        'active_cases': active,
    })