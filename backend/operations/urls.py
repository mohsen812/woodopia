from django.urls import path

from .views import operations_dashboard


app_name = "operations"

urlpatterns = [
    path(
        "",
        operations_dashboard,
        name="dashboard",
    ),
]
