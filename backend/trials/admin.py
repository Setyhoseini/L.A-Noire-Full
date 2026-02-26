from django.contrib import admin

from .models import Trial


@admin.register(Trial)
class TrialAdmin(admin.ModelAdmin):
    list_display = ['case', 'verdict', 'start_date', 'end_date', 'court_room']
    list_filter = ['verdict']
    filter_horizontal = ['witnesses']
