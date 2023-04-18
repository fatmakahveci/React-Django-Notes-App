from rest_framework import serializers
from .models import Note
from django.contrib.auth.models import User


class NoteSerializer(serializers.ModelSerializer):
    author = serializers.ReadOnlyField(source='author.username')

    class Meta:
        model = Note
        fields = '__all__'

    def create(self, validated_data):
        return Note.objects.create(**validated_data)

    def update(self, instance, validated_data):
        instance.title = validated_data.get('title', instance.title)
        instance.body = validated_data.get('body', instance.body)
        instance.save()
        return instance

class RegistrationSerializer(serializers.ModelSerializer):
    matchPassword = serializers.CharField(
        style={"input_type": "password"}, write_only=True)

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
            raise serializers.ValidationError(
                {'password': 'Passwords must match.'})
        user.set_password(password)
        user.save()
        return user
