from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path(
        "",
        include("home.urls")
    ),
    path(
        "accounts/",
        include("users.urls")
    ),
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
    path(
    "api/workspace/",
    include("workspace.urls")
    ),
    path(
    "workspace/",
    include("workspace.urls")
    ),
    
    path(
    "customer/",
    include("customer.urls")
    ),
]
urlpatterns += static(
    settings.MEDIA_URL,
    document_root=settings.MEDIA_ROOT
)
