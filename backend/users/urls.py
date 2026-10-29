from django.contrib.auth.views import LogoutView
from django.urls import path

from .views import (
    UserLoginView,
    customer_register,
    FEEMAASPasswordResetView,
    FEEMAASPasswordResetDoneView,
    FEEMAASPasswordResetConfirmView,
    FEEMAASPasswordResetCompleteView,
    customer_profile_update,
    customer_password_change,
)

urlpatterns = [
    path(
        "profile/",
        customer_profile_update,
        name="customer_profile_update",
    ),
    path(
        "password-change/",
        customer_password_change,
        name="customer_password_change",
    ),
    path("login/", UserLoginView.as_view(), name="login"),
    path("register/", customer_register, name="register"),
    path(
        "password-reset/",
        FEEMAASPasswordResetView.as_view(),
        name="password_reset",
    ),
    path(
        "password-reset/done/",
        FEEMAASPasswordResetDoneView.as_view(),
        name="password_reset_done",
    ),
    path(
        "reset/<uidb64>/<token>/",
        FEEMAASPasswordResetConfirmView.as_view(),
        name="password_reset_confirm",
    ),
    path(
        "reset/done/",
        FEEMAASPasswordResetCompleteView.as_view(),
        name="password_reset_complete",
    ),
    path(
        "logout/",
        LogoutView.as_view(next_page="/"),
        name="logout",
    ),
]
