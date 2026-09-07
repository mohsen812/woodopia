from django.urls import path

from . import views


urlpatterns = [

    path(
        "me/",
        views.workspace_me,
        name="workspace_me"
    ),

]