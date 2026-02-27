from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'bail', views.BailPaymentViewSet, basename='bail-payment')

urlpatterns = [
    path('', include(router.urls)),
]
