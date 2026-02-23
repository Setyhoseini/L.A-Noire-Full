from django.contrib.auth.models import AbstractUser
from django.db import models

class Role(models.Model):
    """Simple Role model to attach to users for RBAC."""
    name = models.CharField(max_length=64, unique=True)
    description = models.TextField(blank=True)
    permissions = models.JSONField(null=True, blank=True)

    def __str__(self):
        return self.name

# Minimal custom user to satisfy AUTH_USER_MODEL in settings
class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('detective', 'Detective'),
        ('officer', 'Officer'),
        ('clerk', 'Clerk'),
        ('prosecutor', 'Prosecutor'),
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

    date_joined = models.DateTimeField(auto_now_add=True)

    def has_role(self, role_name: str) -> bool:
        if self.role == role_name:
            return True
        return self.roles.filter(name=role_name).exists()

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