from django.urls import path

from .views import (
    ProjectListCreateView,
    ProjectDetailView,
    ProjectVisualListCreateView,
    ProjectVisualDetailView,
    ProjectTenderView,
    ProjectTenderSelectWinnerView,
)


urlpatterns = [

    path(
        "",
        ProjectListCreateView.as_view(),
        name="project-list",
    ),


    path(
        "<int:pk>/tender/",
        ProjectTenderView.as_view(),
        name="project-tender",
    ),


    path(
        "<int:pk>/tender/select/",
        ProjectTenderSelectWinnerView.as_view(),
        name="project-tender-select-winner",
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