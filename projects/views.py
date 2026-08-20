from rest_framework import generics

from .models import Project, ProjectVisual

from .serializers import (
    ProjectFullSerializer,
    ProjectCreateSerializer,
    ProjectVisualSerializer,
)


# =====================================
# PROJECT LIST + CREATE
# =====================================

class ProjectListCreateView(
    generics.ListCreateAPIView
):

    queryset = Project.objects.all().order_by(
        "-created_at"
    )

    def get_serializer_class(self):

        if self.request.method == "POST":

            return ProjectCreateSerializer

        return ProjectFullSerializer


# =====================================
# PROJECT DETAIL
# =====================================

class ProjectDetailView(
    generics.RetrieveAPIView
):

    queryset = Project.objects.all()

    serializer_class = ProjectFullSerializer


# =====================================
# PROJECT VISUAL LIST + CREATE
# =====================================

class ProjectVisualListCreateView(
    generics.ListCreateAPIView
):

    queryset = ProjectVisual.objects.all()

    serializer_class = ProjectVisualSerializer


# =====================================
# PROJECT VISUAL DETAIL
# =====================================

class ProjectVisualDetailView(
    generics.RetrieveUpdateDestroyAPIView
):

    queryset = ProjectVisual.objects.all()

    serializer_class = ProjectVisualSerializer