from django.urls import path

from . import views

urlpatterns = [
    path("collaboration-requests/", views.collaboration_requests, name="collaboration_requests"),
    path("collaboration-requests/create/", views.create_collaboration_request, name="create_collaboration_request"),
]
