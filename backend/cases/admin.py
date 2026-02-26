from django.contrib import admin

from .models import Case, Report, CrimeReport, Attachment, AuditLog, Interrogation
from accounts.models import Suspect


@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    list_display = ['case_number', 'title', 'status', 'priority', 'precinct', 'opened_at']
    list_filter = ['status', 'priority', 'is_archived']
    search_fields = ['case_number', 'title', 'description']


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['title', 'report_type', 'case', 'created_at']
    list_filter = ['report_type']


@admin.register(CrimeReport)
class CrimeReportAdmin(admin.ModelAdmin):
    list_display = ['title', 'status', 'reporter', 'location', 'created_at']
    list_filter = ['status']
    search_fields = ['title', 'description']


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ['filename', 'content_type', 'uploaded_at']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['actor_identifier', 'action', 'target_type', 'target_id', 'timestamp']
    list_filter = ['action', 'target_type', 'timestamp']


@admin.register(Interrogation)
class InterrogationAdmin(admin.ModelAdmin):
    list_display = ['case', 'suspect', 'outcome', 'start_time']
    list_filter = ['outcome']


@admin.register(Suspect)
class SuspectAdmin(admin.ModelAdmin):
    list_display = ['person', 'case', 'status', 'start_date', 'crime_degree', 'days_under_pursuit']
    list_filter = ['status']
    search_fields = ['person__first_name', 'person__last_name']
