from django.urls import path

from .views import (
    ProjectListCreateView,
    ProjectDetailView,
    ProjectVisualListCreateView,
    ProjectVisualDetailView,
)


urlpatterns = [

    path(
        "",
        ProjectListCreateView.as_view(),
        name="project-list",
    ),

    path(
        "<int:pk>/",
        ProjectDetailView.as_view(),
        name="project-detail",
    ),

    path(
        "visuals/",
        ProjectVisualListCreateView.as_view(),
        name="visual-list",
    ),

    path(
        "visuals/<int:pk>/",
        ProjectVisualDetailView.as_view(),
        name="visual-detail",
    ),

]
