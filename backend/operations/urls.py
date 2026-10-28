from django.urls import path

from .views import (
    api_online_users,
    operations_account,
    operations_dashboard,
    review_access_request,
)


app_name = "operations"

urlpatterns = [
    path("api/online-users/", api_online_users, name="api_online_users"),
    path("", operations_dashboard, name="dashboard"),
    path("account/", operations_account, name="account"),
    path(
        "access-requests/<int:request_id>/review/",
        review_access_request,
        name="review_access_request",
    ),
]
