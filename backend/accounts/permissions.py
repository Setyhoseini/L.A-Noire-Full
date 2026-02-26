"""
Modular role-based permission classes per PDF.
Maps roles to resource access. Use on views/serializers as needed.
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


# --- Role names per PDF (backend uses: admin, detective, officer, clerk, prosecutor, judge) ---
ROLES_CASES = ['cadet', 'police officer', 'patrol officer', 'detective', 'sergeant', 'captain', 'chief', 'complainant', 'officer', 'clerk']
ROLES_DETECTIVE_BOARD = ['detective']
ROLES_SURVEILLANCE = ['detective', 'sergeant', 'captain', 'chief', 'police officer', 'patrol officer', 'officer']
ROLES_GENERAL_REPORT = ['judge', 'captain', 'chief', 'prosecutor']
ROLES_EVIDENCE = ['detective', 'police officer', 'patrol officer', 'coroner', 'sergeant', 'captain', 'officer', 'clerk']
ROLES_ADMIN = ['administrator', 'admin']


class IsRoleIn(BasePermission):
    """Allow access only if user has one of the given roles."""

    def __init__(self, role_names: list[str]):
        self.role_names = role_names

    def has_permission(self, request, view):
        return _user_has_role(request.user, self.role_names)


class CanAccessCases(BasePermission):
    """Cases & Complaints: Cadet, Police Officer, Patrol Officer, Detective, Sergeant, Captain, Chief, Complainant, Officer, Clerk."""

    def has_permission(self, request, view):
        return _user_has_role(request.user, ROLES_CASES)


class CanAccessDetectiveBoard(BasePermission):
    """Detective Board: Detective only."""

    def has_permission(self, request, view):
        return _user_has_role(request.user, ROLES_DETECTIVE_BOARD)


class CanAccessSurveillance(BasePermission):
    """Under Surveillance: Detective, Sergeant, Captain, Chief, Police Officer, Patrol Officer, Officer."""

    def has_permission(self, request, view):
        return _user_has_role(request.user, ROLES_SURVEILLANCE)


class CanAccessGeneralReport(BasePermission):
    """General Report: Judge, Captain, Chief, Prosecutor."""

    def has_permission(self, request, view):
        return _user_has_role(request.user, ROLES_GENERAL_REPORT)


class CanAccessEvidence(BasePermission):
    """Evidence: Detective, Police Officer, Patrol Officer, Coroner, Sergeant, Captain, Officer, Clerk."""

    def has_permission(self, request, view):
        return _user_has_role(request.user, ROLES_EVIDENCE)


class IsAdmin(BasePermission):
    """Admin Panel: Administrator, admin."""

    def has_permission(self, request, view):
        return _user_has_role(request.user, ROLES_ADMIN)
