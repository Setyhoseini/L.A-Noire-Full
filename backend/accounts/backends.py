from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()

class EmailPhoneNationalBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        # username here can be email, phone, or national_code
        try:
            user = User.objects.get(
                Q(username=username)
                | Q(email=username)
                | Q(phone=username)
                | Q(national_code=username)
            )
        except User.DoesNotExist:
            return None
        
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None 