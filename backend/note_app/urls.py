from django.urls import path
from . import views
from django.urls import path, include

from rest_framework import routers

router = routers.DefaultRouter()                   
router.register(r'notes', views.NoteView, 'note')  

urlpatterns = [
  path('', include(router.urls)),
  
  path('notes/', views.getNotes, name="notes"),
  path('notes/<str:pk>/', views.getNote, name="note"),
]
