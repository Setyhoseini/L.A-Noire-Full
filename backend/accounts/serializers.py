from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Role
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user read operations (profile, etc.).
    Combines user.role (CharField) and user.roles (M2M) so both assignment methods work.
    """
    roles = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone_number', 'national_id',
                  'first_name', 'last_name', 'badge_number', 'rank', 'precinct', 'roles', 'permissions']
        read_only_fields = ['id']

    def get_roles(self, obj):
        names = list(obj.roles.values_list('name', flat=True))
        if obj.role:
            names.append(obj.role)
        return names

    def get_permissions(self, obj):
        return getattr(obj, 'get_all_permissions', lambda: [])()


class UserAdminSerializer(UserSerializer):
    """Extended serializer for admin: includes role_ids and extra_permissions."""
    role_ids = serializers.SerializerMethodField()
    extra_permissions = serializers.ListField(child=serializers.CharField(), read_only=True)

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ['role_ids', 'extra_permissions']

    def get_role_ids(self, obj):
        return list(obj.roles.values_list('id', flat=True))


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for profile update. Writable: first_name, last_name, phone_number, badge_number, rank, precinct."""
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone_number', 'badge_number', 'rank', 'precinct']


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration. Includes password. Returns full user with roles."""
    password = serializers.CharField(write_only=True, min_length=7)
    roles = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone_number', 'national_id',
                  'first_name', 'last_name', 'password', 'roles']
        read_only_fields = ['id', 'roles']

    def get_roles(self, obj):
        names = list(obj.roles.values_list('name', flat=True))
        if obj.role:
            names.append(obj.role)
        return names

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        # Assign Base user role per PDF specification
        base_role, _ = Role.objects.get_or_create(name='Base user')
        user.roles.add(base_role)
        # If national_id matches a Person with suspect entries, assign Suspect role and link
        national_id = getattr(user, 'national_id', None) or validated_data.get('national_id')
        if national_id:
            from .models import Person
            from .models import Suspect
            person = Person.objects.filter(national_id=national_id).first()
            if person and Suspect.objects.filter(person=person).exists():
                suspect_role, _ = Role.objects.get_or_create(name='Suspect')
                user.roles.add(suspect_role)
                user.role = 'suspect'
                user.save(update_fields=['role'])
                person.user = user
                person.save(update_fields=['user'])
        return user

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'permissions'] 

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'identifier'  # This will be the field name in request

    def validate(self, attrs):
        # attrs contains {'identifier': 'value', 'password': 'value'}
        identifier = attrs.get('identifier')
        password = attrs.get('password')

        if identifier and password:
            # Authenticate using our custom backend
            user = authenticate(request=self.context.get('request'),
                                username=identifier,  # our backend expects 'username' param
                                password=password)
            if not user:
                raise serializers.ValidationError('No active account found with the given credentials')
        else:
            raise serializers.ValidationError('Must include "identifier" and "password"')

        refresh = self.get_token(user)
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        }
        return data