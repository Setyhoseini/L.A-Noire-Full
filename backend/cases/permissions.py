from rest_framework.permissions import BasePermission

class CanAssignDetective(BasePermission):
    def has_permission(self, request, view):
        return request.user.has_perm('cases.assign_detective')

class CanVerifyEvidence(BasePermission):
    def has_permission(self, request, view):
        return request.user.has_perm('cases.verify_evidence')

class CanIssueWarrant(BasePermission):
    def has_permission(self, request, view):
        return request.user.has_perm('cases.issue_warrant')

class CanCloseCase(BasePermission):
    def has_permission(self, request, view):
        return request.user.has_perm('cases.close_case')