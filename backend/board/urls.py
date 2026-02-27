from django.urls import path
from . import views

urlpatterns = [
    path('', views.board_overview),
    path('cases/<uuid:case_id>/', views.case_board_detail),
    path('cases/<uuid:case_id>/save/', views.case_board_save),  # PATCH to save nodes/edges
]
