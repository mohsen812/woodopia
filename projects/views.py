from rest_framework import generics

from .models import Project, ProjectVisual
from .serializers import (
    ProjectFullSerializer,
    ProjectVisualSerializer,
)


class ProjectListCreateView(generics.ListCreateAPIView):
    queryset = Project.objects.all().order_by("-created_at")
    serializer_class = ProjectFullSerializer


class ProjectDetailView(generics.RetrieveAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectFullSerializer


class ProjectVisualListCreateView(generics.ListCreateAPIView):
    queryset = ProjectVisual.objects.all()
    serializer_class = ProjectVisualSerializer


class ProjectVisualDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProjectVisual.objects.all()
    serializer_class = ProjectVisualSerializer
