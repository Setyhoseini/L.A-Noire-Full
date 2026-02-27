"""
Modular role-based permission classes per PDF.
Maps roles to resource access. Use on views/serializers as needed.

Permission codes (stored in Role.permissions, seeded in 0005_seed_role_permissions):
- cases.access: Cases & Complaints
- cases.approve_reports: Approve/Return Crime Reports
- board.access: Detective Board
- surveillance.access: Under Surveillance (Most Wanted)
- general_report.access: General Report (Trials)
- evidence.access: Evidence
- admin.access: Admin panel
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


class CanApproveCrimeReports(BasePermission):
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
    """Allow access if user has the given permission via any of their roles (Role.permissions)."""

    def __init__(self, permission_code: str):
        self.permission_code = permission_code

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return getattr(request.user, 'has_role_permission', lambda _: False)(self.permission_code)


class CanAccessCases(BasePermission):
    """Cases & Complaints: Cadet, Police Officer, Patrol Officer, Detective, Sergeant, Captain, Chief, Complainant."""

    def has_permission(self, request, view):
        return _user_has_role(request.user, ROLES_CASES)


class CanAccessDetectiveBoard(BasePermission):
    """Detective Board: Detective only."""

    def has_permission(self, request, view):
        return _user_has_role(request.user, ROLES_DETECTIVE_BOARD)


class CanAccessSurveillance(BasePermission):
    """Under Surveillance: Detective, Sergeant, Captain, Chief, Police Officer, Patrol Officer."""

    def has_permission(self, request, view):
        return _user_has_role(request.user, ROLES_SURVEILLANCE)


class CanAccessGeneralReport(BasePermission):
    """General Report: Judge, Captain, Chief."""

    def has_permission(self, request, view):
        return _user_has_role(request.user, ROLES_GENERAL_REPORT)


class CanAccessEvidence(BasePermission):
    """Evidence: Detective, Police Officer, Patrol Officer, Coroner, Sergeant, Captain."""

    def has_permission(self, request, view):
        return _user_has_role(request.user, ROLES_EVIDENCE)


class IsAdmin(BasePermission):
    """Admin Panel: Administrator, admin."""

    def has_permission(self, request, view):
        return _user_has_role(request.user, ROLES_ADMIN)
