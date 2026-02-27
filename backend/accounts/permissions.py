"""
Permission-based access control. Admin can assign permissions to roles and users.
Permission codes are stored in Role.permissions and User.extra_permissions.
"""
from rest_framework.permissions import BasePermission, IsAdminUser


class HasRolePermission(BasePermission):
    """Allow access if user has the permission (from roles or extra_permissions)."""

    def __init__(self, permission_code: str):
        self.permission_code = permission_code

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return getattr(request.user, 'has_role_permission', lambda _: False)(self.permission_code)


# Convenience classes - each maps to a permission code (admin can change role permissions)
class CanAccessCases(HasRolePermission):
    def __init__(self):
        super().__init__('cases.access')


class CanApproveCrimeReports(HasRolePermission):
    def __init__(self):
        super().__init__('cases.approve_reports')


class CanAccessDetectiveBoard(HasRolePermission):
    def __init__(self):
        super().__init__('board.access')


class CanAccessSurveillance(HasRolePermission):
    def __init__(self):
        super().__init__('surveillance.access')


class CanAccessGeneralReport(HasRolePermission):
    def __init__(self):
        super().__init__('general_report.access')


class CanAccessEvidence(HasRolePermission):
    def __init__(self):
        super().__init__('evidence.access')


class IsAdmin(HasRolePermission):
    def __init__(self):
        super().__init__('admin.access')


class IsAdminOrStaff(BasePermission):
    """Allow Django staff (is_staff) OR users with admin.access. For initial setup, staff can access."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if getattr(request.user, 'is_staff', False):
            return True
        return getattr(request.user, 'has_role_permission', lambda _: False)('admin.access')
