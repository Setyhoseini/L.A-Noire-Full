from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
from rest_framework import generics, permissions
from rest_framework.response import Response
from .serializers import UserSerializer, RegisterSerializer
from .models import Role
from rest_framework import viewsets
from .serializers import RoleSerializer
from django.contrib.auth import get_user_model
from rest_framework.decorators import action
from rest_framework import status

from rest_framework.permissions import IsAuthenticated

class ProfileView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
    
User = get_user_model()

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

    @action(detail=True, methods=['post'])
    def assign_roles(self, request, pk=None):
        user = self.get_object()
        role_ids = request.data.get('role_ids', [])
        roles = Role.objects.filter(id__in=role_ids)
        user.roles.set(roles)
        user.save()
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAdminUser]  # only admin

class RegisterView(generics.CreateAPIView):
    """User registration. Assigns 'Base user' role. Admin assigns other roles later."""
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer