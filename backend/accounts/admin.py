from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Role, User, UserRole, Person, CasePerson


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'permissions_preview']
    search_fields = ['name']
    list_filter = ['name']

    def permissions_preview(self, obj):
        perms = obj.permissions or []
        return ', '.join(perms[:5]) + ('...' if len(perms) > 5 else '') if perms else '-'
    permissions_preview.short_description = 'Permissions'


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_staff', 'is_active']
    list_filter = ['is_staff', 'is_active', 'role']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'phone_number']
    ordering = ['username']
    filter_horizontal = ['roles', 'groups', 'user_permissions']

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login',)}),
        ('Police Info', {'fields': ('badge_number', 'role', 'rank', 'precinct', 'phone_number', 'national_id')}),
        ('Roles', {'fields': ('roles', 'extra_permissions')}),
    )
    add_fieldsets = (
        (None, {'fields': ('username', 'password1', 'password2')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Police Info', {'fields': ('badge_number', 'role', 'rank', 'precinct', 'phone_number', 'national_id')}),
        ('Roles', {'fields': ('roles', 'extra_permissions')}),
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
