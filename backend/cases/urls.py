from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.CaseViewSet, basename='case')
router.register(r'crime-reports', views.CrimeReportViewSet, basename='crime-report')

urlpatterns = [
    path('', include(router.urls)),
]
