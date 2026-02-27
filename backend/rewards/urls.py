from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'tips', views.RewardTipViewSet, basename='reward-tip')

urlpatterns = [
    path('', views.rewards_list),
    path('detectives/', views.detectives_list),
    path('lookup/', views.reward_lookup),
    path('', include(router.urls)),
]
