from django.urls import path, include
from rest_framework import routers
from .views import NoteListView, NoteDetailView

router = routers.DefaultRouter()

urlpatterns = [
    path('notes/', NoteListView.as_view(), name="get-all-or-create"),
    path('notes/<str:pk>/', NoteDetailView.as_view(), name="get-or-modify"),

    path('', include(router.urls)),
]
