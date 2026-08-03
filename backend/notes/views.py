from rest_framework import generics
from rest_framework.filters import SearchFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated

from .models import Note
from .serializers import NoteSerializer


class UserNoteQuerysetMixin:
    """Restrict every notes operation to the authenticated owner."""

    def get_queryset(self):
        # The serializer exposes user.user_name; joining here keeps list query
        # counts constant instead of loading the owner once per note.
        return Note.objects.filter(user=self.request.user).select_related("user")


class NotePagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 100


class NoteListView(UserNoteQuerysetMixin, generics.ListCreateAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = NotePagination
    filter_backends = [SearchFilter]
    search_fields = ["title", "body"]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class NoteDetailView(UserNoteQuerysetMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]
