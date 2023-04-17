from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import NoteSerializer, RegistrationSerializer
from .models import Note


@api_view(['GET'])
def getRoutes(request):
    routes = [
        'token/',
        'token/refresh/',
        'register',
    ]
    return Response(routes)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated,])
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


@permission_classes([AllowAny,])
class RegistrationView(APIView):
    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# @permission_classes([IsAuthenticated,])
# class LoginView(APIView):
#     def
@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([IsAuthenticated,])
def getOrModifyNote(request, pk):
    if request.method == 'GET':
        note = Note.objects.get(id=pk)
        serializer = NoteSerializer(note, many=False)
        return Response(serializer.data)
    elif request.method == 'POST':
        data = request.data  # JSON
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
