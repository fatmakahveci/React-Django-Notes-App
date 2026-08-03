
import re

from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.settings import api_settings as jwt_settings
from rest_framework_simplejwt.utils import get_md5_hash_password
from .models import CustomUser
from .password_policy import PASSWORD_POLICY, password_policy_errors

USERNAME_PATTERN = re.compile(r"^[A-Za-z][A-Za-z0-9_-]{3,23}$")


class CookieTokenRefreshSerializer(TokenRefreshSerializer):
    """Reject refresh tokens issued before a password change."""

    def validate(self, attrs):
        refresh = self.token_class(attrs["refresh"])
        user_id = refresh.payload.get(jwt_settings.USER_ID_CLAIM)
        try:
            user = get_user_model().objects.get(
                **{jwt_settings.USER_ID_FIELD: user_id}
            )
        except get_user_model().DoesNotExist as error:
            raise AuthenticationFailed("Refresh token is no longer valid.") from error

        expected_hash = get_md5_hash_password(user.password)
        if refresh.payload.get(jwt_settings.REVOKE_TOKEN_CLAIM) != expected_hash:
            raise AuthenticationFailed("Refresh token is no longer valid.")
        return super().validate(attrs)


class CustomUserSerializer(serializers.ModelSerializer):

    class Meta:
        model = CustomUser
        fields = ['email', 'user_name']


class RegistrationSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        max_length=50,
        validators=[
            UniqueValidator(
                queryset=CustomUser.objects.all(),
                message="An account with this email already exists.",
            )
        ],
    )
    user_name = serializers.RegexField(
        USERNAME_PATTERN,
        max_length=24,
        validators=[
            UniqueValidator(
                queryset=CustomUser.objects.all(),
                message="An account with this username already exists.",
            )
        ],
        error_messages={"invalid": "Use 4-24 letters, numbers, underscores, or hyphens, starting with a letter."},
    )
    password = serializers.CharField(
        min_length=PASSWORD_POLICY["min_length"],
        max_length=PASSWORD_POLICY["max_length"],
        trim_whitespace=False,
        write_only=True,
    )
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
        policy_errors = password_policy_errors(attrs["password"])
        if policy_errors:
            raise serializers.ValidationError({"password": policy_errors})
        return attrs

    def create(self, validated_data):
        validated_data.pop('match_password')
        # The model manager normalizes the email and hashes the password.
        return CustomUser.objects.create_user(**validated_data)
