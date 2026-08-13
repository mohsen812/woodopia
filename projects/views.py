from rest_framework import generics
from .models import ProjectVisual
from .serializers import ProjectVisualSerializer


class ProjectVisualListCreateView(generics.ListCreateAPIView):
    queryset = ProjectVisual.objects.all()
    serializer_class = ProjectVisualSerializer


class ProjectVisualDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProjectVisual.objects.all()
    serializer_class = ProjectVisualSerializer
