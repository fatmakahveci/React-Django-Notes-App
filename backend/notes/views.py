from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .serializers import NoteSerializer
from .models import Note


@permission_classes([IsAuthenticated])
class NoteListView(APIView):
    def get(self, request):
        notes = Note.objects.filter(user=request.user)
        serializer = NoteSerializer(notes, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data or {}
        note = Note.objects.create(
            user=request.user,
            title=data.get("title", ""),
            body=data.get("body", ""),
        )
        serializer = NoteSerializer(note, many=False)
        return Response(serializer.data)


@permission_classes([IsAuthenticated])
class NoteDetailView(APIView):
    def get(self, request, pk):
        note = get_object_or_404(Note, id=pk, user=request.user)
        serializer = NoteSerializer(note, many=False)
        return Response(serializer.data)

    def post(self, request, pk):
        note = get_object_or_404(Note, id=pk, user=request.user)
        serializer = NoteSerializer(instance=note, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        note = get_object_or_404(Note, id=pk, user=request.user)
        note.delete()
        return Response({"message": "Deleted"})
