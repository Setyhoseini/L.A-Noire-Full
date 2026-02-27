"""
Permission-based access control. Admin can assign permissions to roles and users.
Permission codes are stored in Role.permissions and User.extra_permissions.
"""
from rest_framework.permissions import BasePermission


def _user_has_role(user, role_names: list[str]) -> bool:
    """Check if user has any of the given roles (case-insensitive)."""
    if not user or not user.is_authenticated:
        return False
    names = {r.strip().lower() for r in role_names}
    # Check User.role (CharField)
    if user.role and user.role.lower() in names:
        return True
    # Check User.roles (M2M Role model)
    for r in getattr(user, 'roles', []).all():
        if r.name and r.name.lower() in names:
            return True
    return False


# --- Role names per PDF (officer, prosecutor, clerk not in PDF - removed) ---
ROLES_CASES = ['cadet', 'police officer', 'patrol officer', 'detective', 'sergeant', 'captain', 'chief', 'complainant']
ROLES_CAN_SUBMIT_CRIME_REPORT = ['base user', 'cadet', 'police officer', 'patrol officer', 'detective', 'sergeant', 'captain', 'chief', 'complainant']
ROLES_DETECTIVE_BOARD = ['detective']
ROLES_SURVEILLANCE = ['detective', 'sergeant', 'captain', 'chief', 'police officer', 'patrol officer']
ROLES_GENERAL_REPORT = ['judge', 'captain', 'chief']
ROLES_EVIDENCE = ['detective', 'police officer', 'patrol officer', 'coroner', 'sergeant', 'captain']
ROLES_ADMIN = ['administrator', 'admin']
ROLES_APPROVE_CRIME_REPORTS = ['sergeant', 'captain', 'chief', 'detective']


class CanSubmitCrimeReport(BasePermission):
    """Submit crime reports/complaints. Base user, Cadet, Complainant, and all case roles."""

    def has_permission(self, request, view):
        return _user_has_role(request.user, ROLES_CAN_SUBMIT_CRIME_REPORT)


class CanApproveCrimeReportsByRole(BasePermission):
    """Approve/return crime reports. Sergeant, Captain, Chief, Detective."""

    def has_permission(self, request, view):
        return _user_has_role(request.user, ROLES_APPROVE_CRIME_REPORTS)


class IsRoleIn(BasePermission):
    """Allow access only if user has one of the given roles."""

    def __init__(self, role_names: list[str]):
        self.role_names = role_names

    def has_permission(self, request, view):
        return _user_has_role(request.user, self.role_names)


class HasRolePermission(BasePermission):
    """Allow access if user has the permission (from roles or extra_permissions)."""

    def __init__(self, permission_code: str):
        self.permission_code = permission_code

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return getattr(request.user, 'has_role_permission', lambda _: False)(self.permission_code)


# Convenience classes: permission-based (primary) + role fallback (when permissions not seeded)
class _HybridPermission(BasePermission):
    """Allow if user has permission OR has one of the fallback roles. Flexible for both systems."""

    def __init__(self, permission_code: str, fallback_roles: list[str]):
        self.permission_code = permission_code
        self.fallback_roles = fallback_roles

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if getattr(request.user, 'has_role_permission', lambda _: False)(self.permission_code):
            return True
        return _user_has_role(request.user, self.fallback_roles)


class CanAccessCases(_HybridPermission):
    def __init__(self):
        super().__init__('cases.access', ROLES_CASES)


class CanApproveCrimeReports(_HybridPermission):
    def __init__(self):
        super().__init__('cases.approve_reports', ROLES_APPROVE_CRIME_REPORTS)


class CanAccessDetectiveBoard(_HybridPermission):
    def __init__(self):
        super().__init__('board.access', ROLES_DETECTIVE_BOARD)


class CanAccessSurveillance(_HybridPermission):
    def __init__(self):
        super().__init__('surveillance.access', ROLES_SURVEILLANCE)


class CanAccessGeneralReport(_HybridPermission):
    def __init__(self):
        super().__init__('general_report.access', ROLES_GENERAL_REPORT)


class CanAccessEvidence(_HybridPermission):
    def __init__(self):
        super().__init__('evidence.access', ROLES_EVIDENCE)


class IsAdmin(_HybridPermission):
    def __init__(self):
        super().__init__('admin.access', ROLES_ADMIN)


class IsAdminOrStaff(BasePermission):
    """Allow Django staff (is_staff) OR users with admin.access OR admin/administrator role. For initial setup."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if getattr(request.user, 'is_staff', False):
            return True
        if getattr(request.user, 'has_role_permission', lambda _: False)('admin.access'):
            return True
        return _user_has_role(request.user, ROLES_ADMIN)
