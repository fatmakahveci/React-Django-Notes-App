from rest_framework import serializers
from .models import Note
from django.contrib.auth.models import User


class RegistrationSerializer(serializers.ModelSerializer):
    matchPassword = serializers.CharField(style={"input_type": "password"}, write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'matchPassword']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def save(self):
        user = User(username=self.validated_data['username'])
        password = self.validated_data['password']
        matchPassword = self.validated_data['matchPassword']
        if password != matchPassword:
            raise serializers.ValidationError({'password': 'Passwords must match.'})
        user.set_password(password)
        user.save()
        return user


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = '__all__'
