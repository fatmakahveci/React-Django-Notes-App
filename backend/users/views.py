from rest_framework import generics as rest_generics
from django.views import generic as django_generic
from .serializers import AuthorSerializer
from .models import Author
from django.urls import reverse_lazy


class AuthorsListView(rest_generics.ListAPIView):
    serializer_class = AuthorSerializer
    queryset = Author.objects.all()


class AuthorRetrieveDeleteView(rest_generics.RetrieveDestroyAPIView):
    serializer_class = AuthorSerializer
    queryset = Author.objects.all()
    lookup_field = 'username'
    lookup_url_kwarg = 'username'


class AuthorCreationView(django_generic.CreateView):
    template_name = 'signup.html'
    success_url = reverse_lazy('login')
