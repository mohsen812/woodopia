from django.urls import path
from .views import (
    ProjectVisualListCreateView,
    ProjectVisualDetailView,
)


urlpatterns = [

    path(
        "visuals/",
        ProjectVisualListCreateView.as_view()
    ),

    path(
        "visuals/<int:pk>/",
        ProjectVisualDetailView.as_view()
    ),

]
