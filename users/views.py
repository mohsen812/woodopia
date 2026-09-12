from django.contrib.auth.views import LoginView

from .forms import UserLoginForm


class UserLoginView(LoginView):
    template_name = "users/login.html"
    authentication_form = UserLoginForm