from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Note
from .serializers import NoteSerializer


class UserNoteQuerysetMixin:
    """Restrict every notes operation to the authenticated owner."""

    def get_queryset(self):
        return Note.objects.filter(user=self.request.user)


class NoteListView(UserNoteQuerysetMixin, generics.ListCreateAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class NoteDetailView(UserNoteQuerysetMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]
