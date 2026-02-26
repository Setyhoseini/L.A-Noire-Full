from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.contrib import admin

from .views import (
    CustomTokenObtainPairView, RegisterView, RoleViewSet,
    UserViewSet, ProfileView, ChangePasswordView, dashboard_stats,
)

router = DefaultRouter()
router.register(r'roles', RoleViewSet)
router.register(r'users', UserViewSet)

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('dashboard/stats/', dashboard_stats, name='dashboard_stats'),
    path('', include(router.urls)),
]