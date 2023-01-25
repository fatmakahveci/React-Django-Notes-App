from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .serializers import NoteSerializer 
from rest_framework import viewsets      
from .models import Note
from .utils import getNotesInfo, getNoteInfo, createNote, updateNote, deleteNote

class NoteView(viewsets.ModelViewSet):  
    serializer_class = NoteSerializer   
    queryset = Note.objects.all()   
    
@api_view(['GET', 'POST'])
def getNotes(request):
  if request.method == "GET":
    return getNotesInfo(request)
  elif request.method == "POST":
    return createNote(request)

@api_view(['GET', 'PUT', 'DELETE'])
def getNote(request, pk):
  if request.method == "GET":
    return getNoteInfo(request, pk)
  elif request.method == "PUT":
    return updateNote(request, pk)
  elif request.method == "DELETE":
    return deleteNote(request, pk)
