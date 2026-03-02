from rest_framework import serializers
from .models import Note


class NoteSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source="user.user_name")

    class Meta:
        model = Note
        fields = ["id", "user", "title", "body", "created", "updated"]
        read_only_fields = ["id", "user", "created", "updated"]

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.body = validated_data.get("body", instance.body)
        instance.save()
        return instance
