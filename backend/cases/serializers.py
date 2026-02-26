from rest_framework import serializers
from .models import Case

class CaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Case
        fields = '__all__'  # یا لیست مشخصی از فیلدها مانند ['id', 'title', 'description', ...]