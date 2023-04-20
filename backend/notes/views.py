from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import NoteSerializer
from .models import Note


@permission_classes([IsAuthenticated,])
class NoteListView(APIView):
    def get(self, request):
        notes = Note.objects.all()
        serializer = NoteSerializer(notes, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data
        note = Note.objects.create(author=request.user, body=data['body'])
        serializer = NoteSerializer(note, many=False)
        return Response(serializer.data)


@permission_classes([IsAuthenticated,])
class NoteDetailView(APIView):
    def get(self, request, pk):
        note = Note.objects.get(id=pk)
        serializer = NoteSerializer(note, many=False)
        return Response(serializer.data)

    def post(self, request, pk):
        data = request.data  # JSON
        note = Note.objects.get(id=pk)
        serializer = NoteSerializer(instance=note, data=data)
        if serializer.is_valid():
            serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        note = Note.objects.get(id=pk)
        note.delete()
        return Response('Note is deleted.')
