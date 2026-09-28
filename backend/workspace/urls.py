from django.urls import path
from . import views


urlpatterns = [

    path(
        "",
        views.workspace_page,
        name="workspace"
    ),

    path(
        "identity/",
        views.identity,
        name="workspace_identity"
    ),

]