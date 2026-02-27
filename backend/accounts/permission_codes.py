"""
Permission codes for RBAC. Used by admin UI and API.
Admin can assign these to roles (Role.permissions) or users (User.extra_permissions).
"""
from django.utils.translation import gettext_lazy as _

# Permission code -> (label, description)
PERMISSION_CODES = {
    'cases.access': (_('Cases & Complaints'), _('View and manage cases')),
    'cases.approve_reports': (_('Approve Crime Reports'), _('Approve or return crime reports')),
    'board.access': (_('Detective Board'), _('Access the detective board')),
    'surveillance.access': (_('Under Surveillance'), _('View most wanted / surveillance')),
    'general_report.access': (_('General Report'), _('Access trials and general reports')),
    'evidence.access': (_('Evidence'), _('View and manage evidence')),
    'admin.access': (_('Admin Panel'), _('Access admin panel')),
}


def get_permissions_for_api():
    """Return permission codes for admin UI. Format: [{code, label, description}, ...]"""
    return [
        {
            'code': code,
            'label': str(label),
            'description': str(desc),
        }
        for code, (label, desc) in PERMISSION_CODES.items()
    ]
