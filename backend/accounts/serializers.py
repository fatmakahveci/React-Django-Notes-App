
from rest_framework import serializers
from .models import CustomUser


class CustomUserSerializer(serializers.ModelSerializer):

    class Meta:
        model = CustomUser
        fields = ['email', 'user_name']


class RegisterationSerializer(serializers.ModelSerializer):
    match_password = serializers.CharField(
        style={"input_type": "password"}, write_only=True)

    class Meta:
        model = CustomUser
        fields = ('email', 'user_name', 'password', 'match_password')
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def save(self):
        user = CustomUser(
            email=self.validated_data['email'], user_name=self.validated_data['user_name'], password=None)
        password = self.validated_data['password']
        match_password = self.validated_data['match_password']
        if password != match_password:
            raise serializers.ValidationError(
                {'password': 'Passwords must match.'})
        user.set_password(password)
        user.save()
        return user
