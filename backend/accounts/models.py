from django.contrib.auth.models import AbstractUser
from django.db import models

class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)
    
    def __str__(self):
        return self.name

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, unique=True)
    national_code = models.CharField(max_length=10, unique=True)
    roles = models.ManyToManyField(Role, blank=True)

    # We'll keep username as a regular field; it will also be unique by default.
    
    USERNAME_FIELD = 'username'  # still username for Django admin
    REQUIRED_FIELDS = ['email', 'phone', 'national_code', 'first_name', 'last_name']
    
    def __str__(self):
        return self.username