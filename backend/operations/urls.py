from django.urls import path

from .views import (
    api_online_users,
    change_workshop_status,
    change_workshop_tender_availability,
    operations_account,
    operations_dashboard,
    review_access_request,
)


app_name = "operations"

urlpatterns = [
    path("api/online-users/", api_online_users, name="api_online_users"),
    path("", operations_dashboard, name="dashboard"),
    path(
        "workshops/<int:organization_id>/status/",
        change_workshop_status,
        name="change_workshop_status",
    ),
    path(
        "workshops/<int:organization_id>/tender-availability/",
        change_workshop_tender_availability,
        name="change_workshop_tender_availability",
    ),
    path("account/", operations_account, name="account"),
    path(
        "access-requests/<int:request_id>/review/",
        review_access_request,
        name="review_access_request",
    ),
]
