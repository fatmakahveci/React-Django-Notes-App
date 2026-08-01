
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from .models import CustomUser


class CustomUserSerializer(serializers.ModelSerializer):

    class Meta:
        model = CustomUser
        fields = ['email', 'user_name']


class RegistrationSerializer(serializers.ModelSerializer):
    match_password = serializers.CharField(
        style={"input_type": "password"}, write_only=True)

    class Meta:
        model = CustomUser
        fields = ('email', 'user_name', 'password', 'match_password')
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['match_password']:
            raise serializers.ValidationError(
                {'password': 'Passwords must match.'})  # nosec B105: validation text
        try:
            validate_password(attrs['password'])
        except DjangoValidationError as error:
            raise serializers.ValidationError({'password': error.messages}) from error
        return attrs

    def create(self, validated_data):
        validated_data.pop('match_password')
        # The model manager normalizes the email and hashes the password.
        return CustomUser.objects.create_user(**validated_data)
