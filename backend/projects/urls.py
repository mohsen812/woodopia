from django.urls import path
from projects.api.graph import project_graph


urlpatterns = [

    path(
        "api/graph/<int:project_id>/",
        project_graph,
        name="project_graph"
    ),

]
