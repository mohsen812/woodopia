from django.urls import path

from . import api


urlpatterns = [
    path(
        "my/",
        api.my_organizations,
        name="my_organizations"
    ),

    path(
        "workshops/",
        api.workshop_list,
        name="workshop_list"
    ),
    
    path(
        "<int:organization_id>/",
        api.organization_detail,
        name="organization_detail"
    ),
]
