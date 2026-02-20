from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
from rest_framework import generics, permissions
from rest_framework.response import Response
from .serializers import UserSerializer
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
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]  # anyone can register

    def perform_create(self, serializer):
        user = serializer.save()
        # Set password properly
        user.set_password(self.request.data.get('password'))
        # Assign default role 'user' (you need to create this role first)
        user_role, _ = Role.objects.get_or_create(name='user')
        user.roles.add(user_role)
        user.save()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer