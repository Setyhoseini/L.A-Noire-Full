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

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone_number', 'national_id',
                  'first_name', 'last_name', 'badge_number', 'rank', 'precinct', 'roles']
        read_only_fields = ['id']

    def get_roles(self, obj):
        names = list(obj.roles.values_list('name', flat=True))
        if obj.role:
            names.append(obj.role)
        return names


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