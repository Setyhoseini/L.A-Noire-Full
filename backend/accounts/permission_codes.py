"""
تعریف تمام پرمیشن‌های قابل استفاده در سیستم.
ادمین می‌تواند این پرمیشن‌ها را به رول‌ها یا کاربران خاص اختصاص دهد.
"""
# Permission code -> (label_fa, label_en, description)
ALL_PERMISSIONS = [
    ('cases.access', 'دسترسی پرونده‌ها و شکایات', 'Cases & Complaints', 'مشاهده و مدیریت پرونده‌ها و شکایات'),
    ('cases.approve_reports', 'تأیید گزارش‌های جنایی', 'Approve Crime Reports', 'تأیید یا برگرداندن گزارش‌های جنایی'),
    ('board.access', 'تخته کارآگاه', 'Detective Board', 'دسترسی به تخته کارآگاه'),
    ('surveillance.access', 'تحت پیگیری شدید', 'Under Surveillance', 'مشاهده مظنونین و مجرمان تحت تعقیب'),
    ('general_report.access', 'گزارش کلی', 'General Report', 'دسترسی به گزارش‌های کلی و محاکمات'),
    ('evidence.access', 'مدارک و شواهد', 'Evidence', 'ثبت و بررسی مدارک'),
    ('admin.access', 'پنل ادمین', 'Admin Panel', 'دسترسی به پنل مدیریت سیستم'),
]


def get_all_permission_codes():
    """Return list of all permission codes."""
    return [p[0] for p in ALL_PERMISSIONS]


def get_permissions_for_api():
    """Return list of dicts for API: code, label_fa, label_en, description."""
    return [
        {'code': p[0], 'label_fa': p[1], 'label_en': p[2], 'description': p[3]}
        for p in ALL_PERMISSIONS
    ]
