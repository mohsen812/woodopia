from django.urls import path

from .views import ProjectConversationView


urlpatterns = [
    path(
        "projects/<int:project_id>/",
        ProjectConversationView.as_view(),
        name="project_conversation",
    ),
]
