from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Role, User, UserRole, Person, CasePerson


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']
    search_fields = ['name']


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_staff', 'is_active']
    list_filter = ['is_staff', 'is_active', 'role']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'phone_number']
    ordering = ['username']
    filter_horizontal = ['roles', 'groups', 'user_permissions']

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Police Info', {'fields': ('badge_number', 'role', 'rank', 'precinct', 'phone_number', 'national_id')}),
        ('Roles', {'fields': ('roles',)}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (None, {'fields': ('email',)}),
        ('Police Info', {'fields': ('badge_number', 'role', 'rank', 'precinct', 'phone_number', 'national_id')}),
    )


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'assigned_at']
    list_filter = ['role']


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'person_type', 'created_at']
    list_filter = ['person_type']
    search_fields = ['first_name', 'last_name']


@admin.register(CasePerson)
class CasePersonAdmin(admin.ModelAdmin):
    list_display = ['case', 'person', 'role_in_case']
    list_filter = ['role_in_case']
