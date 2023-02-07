from rest_framework import viewsets, generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .serializers import NoteSerializer, RegisterSerializer, UserSerializer
from django.contrib.auth.models import User
from .models import Note
from .utils import getNotesInfo, getNoteInfo, createNote, updateNote, deleteNote

class UserList(generics.ListAPIView):
  queryset = User.objects.all()
  permission_classes = (IsAuthenticated,)
  serializer_class = UserSerializer

class UserDetail(generics.RetrieveAPIView):
  queryset = User.objects.all()
  permission_classes = (IsAuthenticated,)
  serializer_class = UserSerializer

class RegisterView(generics.CreateAPIView):
  queryset = User.objects.all()
  permission_classes = (AllowAny,)
  serializer_class = RegisterSerializer
    
class NoteView(viewsets.ModelViewSet):
  serializer_class = NoteSerializer
  permission_classes = (IsAuthenticated,)
  queryset = Note.objects.all()

@api_view(['GET'])
def getRoutes(request):
  routes = [
      'token/',
      'token/refresh/',
      'register/',
  ]
  return Response(routes)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def testEndPoint(request):
  if request.method == 'GET':
    data = f"Congratulation {request.user}, your API just responded to GET request"
    return Response({'response': data}, status=status.HTTP_200_OK)
  elif request.method == 'POST':
    text = request.POST.get('text')
    data = f'Congratulation your API just responded to POST request with text: {text}'
    return Response({'response': data}, status=status.HTTP_200_OK)
  return Response({}, status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def getNotes(request):
  if request.method == "GET":
    return getNotesInfo(request)

@api_view(['GET', 'POST', 'PUT', 'DELETE'])
def getNote(request, pk):
  if request.method == "GET":
    return getNoteInfo(request, pk)
  elif request.method == "POST":
    return createNote(request)
  elif request.method == "PUT":
    return updateNote(request, pk)
  elif request.method == "DELETE":
    return deleteNote(pk)
