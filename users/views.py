from django.contrib.auth.views import LoginView


from .forms import UserLoginForm


class UserLoginView(LoginView):
    template_name = "users/login.html"
    authentication_form = UserLoginForm

    def get_success_url(self):
        user = self.request.user

        # Admin / developer workspace
        if user.is_staff:
            return "/workspace/"

        # Customer application
        return "/customer/"