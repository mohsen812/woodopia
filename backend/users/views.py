from django.contrib.auth.views import LoginView

from .forms import UserLoginForm
from .services import get_user_landing_page


class UserLoginView(LoginView):

    template_name = "users/login.html"

    authentication_form = UserLoginForm


    def get_success_url(self):

        return get_user_landing_page(
            self.request.user
        )
