from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend


class EmailOrUsernameBackend(ModelBackend):
    """
    Authenticate users by username or email.
    """

    def authenticate(
        self,
        request,
        username=None,
        password=None,
        **kwargs,
    ):
        UserModel = get_user_model()

        if username is None:
            username = kwargs.get(UserModel.USERNAME_FIELD)

        if username is None or password is None:
            return None

        user = None

        try:
            user = UserModel._default_manager.get_by_natural_key(username)
        except UserModel.DoesNotExist:
            try:
                user = UserModel._default_manager.get(
                    email__iexact=username
                )
            except UserModel.DoesNotExist:
                # Run the password hasher to reduce timing differences.
                UserModel().set_password(password)
                return None
            except UserModel.MultipleObjectsReturned:
                return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user

        return None
