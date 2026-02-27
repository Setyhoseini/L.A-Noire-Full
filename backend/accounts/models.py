from django.contrib.auth.models import AbstractUser
from django.db import models

class Role(models.Model):
    """Simple Role model to attach to users for RBAC."""
    name = models.CharField(max_length=64, unique=True)
    description = models.TextField(blank=True)
    permissions = models.JSONField(default=list, blank=True)

    def __str__(self):
        return self.name

# Minimal custom user to satisfy AUTH_USER_MODEL in settings
# All roles per PDF: Cases, Detective Board, Surveillance, General Report, Evidence, Admin
class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('administrator', 'Administrator'),
        ('cadet', 'Cadet'),
        ('police officer', 'Police Officer'),
        ('patrol officer', 'Patrol Officer'),
        ('detective', 'Detective'),
        ('sergeant', 'Sergeant'),
        ('captain', 'Captain'),
        ('chief', 'Chief'),
        ('complainant', 'Complainant'),
        ('coroner', 'Coroner'),
        ('judge', 'Judge'),
    ] 
	    # override email to be unique
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=32, unique=True, null=True, blank=True)
    national_id = models.CharField(max_length=32, unique=True, null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profiles/%Y/%m/%d', null=True, blank=True)

    badge_number = models.CharField(max_length=64, blank=True)
    role = models.CharField(max_length=32, choices=ROLE_CHOICES, blank=True)
    rank = models.CharField(max_length=64, blank=True)
    precinct = models.CharField(max_length=64, blank=True)
    roles = models.ManyToManyField(Role, related_name='users', blank=True)
    extra_permissions = models.JSONField(default=list, blank=True)  # Permission codes granted directly to this user

    date_joined = models.DateTimeField(auto_now_add=True)

    def has_role(self, role_name: str) -> bool:
        if self.role == role_name:
            return True
        return self.roles.filter(name=role_name).exists()

    def has_role_permission(self, permission_code: str) -> bool:
        """Check if user has a permission via roles (Role.permissions) or extra_permissions."""
        if not self.is_authenticated:
            return False
        # User-specific extra permissions (admin can grant to any user)
        extra = getattr(self, 'extra_permissions', None) or []
        if permission_code in extra:
            return True
        # Check roles M2M
        for r in getattr(self, 'roles', []).all():
            perms = r.permissions or []
            if permission_code in perms:
                return True
        # Map User.role (CharField) to Role and check its permissions
        role_name = getattr(self, 'role', None)
        if role_name:
            try:
                role = Role.objects.filter(name__iexact=role_name).first()
                if role and role.permissions and permission_code in role.permissions:
                    return True
            except Exception:
                pass
        return False

    def get_all_permissions(self) -> list:
        """Return all permission codes this user has (from roles + extra_permissions)."""
        seen = set()
        result = []
        # Extra permissions first
        for p in (getattr(self, 'extra_permissions', None) or []):
            if p and p not in seen:
                seen.add(p)
                result.append(p)
        # From roles
        for r in getattr(self, 'roles', []).all():
            for p in (r.permissions or []):
                if p and p not in seen:
                    seen.add(p)
                    result.append(p)
        # From User.role (CharField)
        role_name = getattr(self, 'role', None)
        if role_name:
            try:
                role = Role.objects.filter(name__iexact=role_name).first()
                if role and role.permissions:
                    for p in role.permissions:
                        if p and p not in seen:
                            seen.add(p)
                            result.append(p)
            except Exception:
                pass
        return result

    def __str__(self):
        return self.get_full_name() or self.username

import uuid
from django.db import models
from django.utils import timezone


class Person(models.Model):
	PERSON_TYPE = [
		('complainant', 'Complainant'),
		('witness', 'Witness'),
		('suspect', 'Suspect'),
		('criminal', 'Criminal'),
		('other', 'Other'),
	]

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	first_name = models.CharField(max_length=120)
	last_name = models.CharField(max_length=120)
	dob = models.DateField(null=True, blank=True)
	aliases = models.JSONField(null=True, blank=True)
	contact_info = models.JSONField(null=True, blank=True)
	person_type = models.CharField(max_length=32, choices=PERSON_TYPE, default='other')
	notes = models.TextField(blank=True)
	created_at = models.DateTimeField(default=timezone.now)
	class Meta:
		app_label = 'accounts'

	def full_name(self):

		return f"{self.first_name} {self.last_name}"

	def __str__(self):
		return self.full_name()

	def compute_hot_pursuit_stats(self):
		"""Compute aggregated stats used for hot-pursuit ranking.

		Returns a dict with keys: max_days, max_crime_degree, rank, reward, cases
		"""
		# Suspects related_name is `suspect_entries` on Suspect.person
		suspects = getattr(self, 'suspect_entries', None)
		if suspects is None:
			return {'max_days': 0, 'max_crime_degree': 0, 'rank': 0, 'reward': 0, 'cases': []}

		max_days = 0
		max_crime_degree = 0
		case_set = set()

		for s in suspects.all():
			try:
				case_status = getattr(s.case, 'status', None)
			except Exception:
				case_status = None
			# Only consider active cases for days calculation
			if case_status in ('open', 'investigation'):
				days = (timezone.now().date() - (s.start_date or timezone.now().date())).days
				if days > max_days:
					max_days = days
			# crime degree considered regardless of case status for ranking
			if s.crime_degree:
				try:
					cd = int(s.crime_degree)
				except Exception:
					cd = 0
				if cd > max_crime_degree:
					max_crime_degree = cd
			if s.case and getattr(s.case, 'case_number', None):
				case_set.add(s.case.case_number)

		rank = max_days * max_crime_degree
		reward = rank * 20000000 if rank > 0 else 0

		return {
			'max_days': max_days,
			'max_crime_degree': max_crime_degree,
			'rank': rank,
			'reward': reward,
			'cases': list(case_set),
		}





class UserRole(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_roles')
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='user_roles')
    assigned_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ انتصاب")

    def __str__(self):
        return f"{self.user.username} - {self.role.name}"

    class Meta:
        unique_together = ('user', 'role')  # هر کاربر یک نقش را فقط یک بار می‌تواند داشته باشد
        verbose_name = "نقش کاربر"
        verbose_name_plural = "نقش‌های کاربران"

def _today_date():
    """Return today's date (timezone-aware). Use for DateField defaults."""
    return timezone.now().date()


class Suspect(models.Model):
	STATUS_CHOICES = [
		('UNDER_PURSUIT', 'Under Pursuit'),
		('HOT_PURSUIT', 'Hot Pursuit'),
		('CAPTURED', 'Captured'),
		('RELEASED', 'Released'),
	]

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	person = models.ForeignKey('accounts.Person', on_delete=models.CASCADE, related_name='suspect_entries')
	case = models.ForeignKey('cases.Case', on_delete=models.CASCADE, related_name='suspects')
	status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='UNDER_PURSUIT')
	start_date = models.DateField(default=_today_date)
	last_status_update = models.DateField(null=True, blank=True)
	crime_degree = models.IntegerField(null=True, blank=True)

	class Meta:
		ordering = ['-start_date']
		app_label = 'cases'

	def __str__(self):
		return f"Suspect {self.person} in {self.case} ({self.status})"

	@property
	def days_under_pursuit(self):
		from django.utils import timezone as _tz
		if not self.start_date:
			return 0
		return (_tz.now().date() - self.start_date).days

	def update_status_if_expired(self, threshold_days=30):
		if self.status == 'UNDER_PURSUIT' and self.days_under_pursuit >= threshold_days:
			self.status = 'HOT_PURSUIT'
			self.last_status_update = timezone.now().date()
			self.save()
			return True
		return False

class CasePerson(models.Model):
    ROLE_CHOICES = [
        ('complainant', 'Complainant'),
        ('witness', 'Witness'),
        ('suspect', 'Suspect'),
        ('victim', 'Victim'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey('cases.Case', on_delete=models.CASCADE, related_name='case_people')
    person = models.ForeignKey('accounts.Person', on_delete=models.CASCADE, related_name='case_roles')
    role_in_case = models.CharField(max_length=32, choices=ROLE_CHOICES, default='other')
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ('case', 'person', 'role_in_case')

    def __str__(self):
        return f"{self.person} as {self.role_in_case} in {self.case}"
