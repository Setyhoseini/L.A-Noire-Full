from django.contrib import admin
from .models import CaseBoard


@admin.register(CaseBoard)
class CaseBoardAdmin(admin.ModelAdmin):
    list_display = ['case', 'updated_at']
    list_filter = ['updated_at']
    search_fields = ['case__case_number', 'case__title']
