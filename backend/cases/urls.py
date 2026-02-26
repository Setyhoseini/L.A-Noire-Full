from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
# Register specific routes BEFORE the catch-all '' so /persons/, /suspects/, /crime-reports/
# don't get matched as case pk (which would route to CaseViewSet.detail and reject POST).
router.register(r'crime-reports', views.CrimeReportViewSet, basename='crime-report')
router.register(r'persons', views.PersonViewSet, basename='person')
router.register(r'suspects', views.SuspectViewSet, basename='suspect')
router.register(r'', views.CaseViewSet, basename='case')

urlpatterns = [
    path('', include(router.urls)),
]
