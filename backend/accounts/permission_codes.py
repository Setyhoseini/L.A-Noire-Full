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
    'interrogation.access': (_('Interrogation Access'), _('Submit guilt scores as Sergeant/Detective')),
    'interrogation.captain_verdict': (_('Captain Verdict'), _('Give captain verdict on interrogations')),
    'interrogation.chief_approve': (_('Chief Approval'), _('Approve or reject captain verdict for critical cases')),
    'tips.submit': (_('Submit Tip'), _('Submit reward tips')),
    'tips.review': (_('Tip Review'), _('Officer initial review of tips')),
    'tips.confirm': (_('Tip Confirm'), _('Detective confirm and generate code')),
    'tips.lookup': (_('Reward Lookup'), _('Lookup reward by national ID + code')),
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
