from django.test import override_settings
from rest_framework import viewsets, generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .serializers import NoteSerializer, RegisterSerializer, UserSerializer
from django.contrib.auth.models import User
from .models import Note

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

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def getNotesOrCreateNote(request):
  if request.method == 'GET':
    notes = Note.objects.all()
    serializer = NoteSerializer(notes, many=True)
    return Response(serializer.data)
  else:
    data = request.data
    note = Note.objects.create(user=request.user, body=data['body'])
    serializer = NoteSerializer(note, many=False)
    return Response(serializer.data)

@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def getOrModifyNote(request, pk):
  if request.method == 'GET':
    note = Note.objects.get(id=pk)
    serializer = NoteSerializer(note, many=False)
    return Response(serializer.data)
  elif request.method == 'POST':
    data = request.data # JSON
    note = Note.objects.get(id=pk)
    serializer = NoteSerializer(instance=note, data=data)
    if serializer.is_valid():
      serializer.save()
    return Response(serializer.data)
  elif request.method == 'DELETE':
    note = Note.objects.get(id=pk)
    note.delete()
    return Response('Note is deleted.')
  else:
    print("throw error here")
