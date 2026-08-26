from django.contrib import admin
from django.urls import path, include


urlpatterns = [
    path('admin/', admin.site.urls),

    path(
        'api/organizations/',
        include('organizations.urls')
    ),

    path(
        'projects/',
        include('projects.urls')
    ),
    path(
    "api/projects/",
    include("projects.urls")
),
path(
    "api/tenders/",
    include("tenders.urls")
),
]
