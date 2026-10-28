import uuid

from django.contrib.auth import login
from django.contrib.auth.views import (
    LoginView,
    PasswordResetView,
    PasswordResetDoneView,
    PasswordResetConfirmView,
    PasswordResetCompleteView,
)
from django.db import IntegrityError, transaction
from django.shortcuts import redirect, render
from django.urls import reverse_lazy
from django.views.decorators.debug import sensitive_post_parameters
from django.utils.decorators import method_decorator

from organizations.models import Membership, Organization, OrganizationRole
from .forms import CustomerRegistrationForm, UserLoginForm
from .models import User
from .services import get_user_landing_page


def _create_customer_account(request, form):
    data = form.cleaned_data
    email = data["email"]

    try:
        with transaction.atomic():
            username_base = email[:120]
            username = username_base

            while User.objects.filter(username=username).exists():
                username = "{}-{}".format(
                    username_base[:130],
                    uuid.uuid4().hex[:12],
                )

            user = User(
                username=username,
                email=email,
                first_name=data["first_name"].strip(),
                last_name=data["last_name"].strip(),
                is_active=True,
            )
            user.set_password(data["password1"])
            user.save()

            organization = Organization.objects.create(
                name="Account",
                organization_type="customer",
                legal_type="individual",
                status="active",
                owner=user,
            )
            organization.name = organization.account_code
            organization.save(update_fields=["name"])

            owner_role = OrganizationRole.objects.filter(
                name="owner"
            ).first()

            Membership.objects.create(
                user=user,
                organization=organization,
                role="owner",
                role_fk=owner_role,
                status="active",
            )

    except IntegrityError:
        form.add_error(
            "email",
            "ساخت حساب با این اطلاعات ممکن نشد. ایمیل را بررسی کنید.",
        )
        return None

    return user


class UserLoginView(LoginView):
    template_name = "users/login.html"
    authentication_form = UserLoginForm

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        if "register_form" not in context:
            context["register_form"] = CustomerRegistrationForm()

        default_mode = (
            "register"
            if self.request.resolver_match and self.request.resolver_match.url_name == "register"
            else "login"
        )
        context["active_panel"] = self.request.GET.get("mode", default_mode)
        return context

    @method_decorator(sensitive_post_parameters("password", "password1", "password2"))
    def post(self, request, *args, **kwargs):
        if request.POST.get("auth_action") == "register":
            if request.user.is_authenticated:
                return redirect(get_user_landing_page(request.user))

            register_form = CustomerRegistrationForm(request.POST)

            if register_form.is_valid():
                user = _create_customer_account(request, register_form)

                if user is not None:
                    login(
                        request,
                        user,
                        backend="django.contrib.auth.backends.ModelBackend",
                    )
                    return redirect(get_user_landing_page(user))

            login_form = self.get_form()
            context = self.get_context_data(
                form=login_form,
                register_form=register_form,
            )
            context["active_panel"] = "register"
            return self.render_to_response(context)

        return super().post(request, *args, **kwargs)

    def get_success_url(self):
        if self.request.user.groups.filter(
            name="FEEMAAS Operations"
        ).exists():
            return "/operations/"

        return get_user_landing_page(self.request.user)


@sensitive_post_parameters("password1", "password2")
def customer_register(request):
    if request.user.is_authenticated:
        return redirect(get_user_landing_page(request.user))

    if request.method == "POST":
        form = CustomerRegistrationForm(request.POST)

        if form.is_valid():
            user = _create_customer_account(request, form)

            if user is not None:
                login(
                    request,
                    user,
                    backend="django.contrib.auth.backends.ModelBackend",
                )
                return redirect(get_user_landing_page(user))
    else:
        form = CustomerRegistrationForm()

    return render(
        request,
        "users/login.html",
        {
            "form": UserLoginForm(request=request),
            "register_form": form,
            "active_panel": "register",
        },
    )


class FEEMAASPasswordResetView(PasswordResetView):
    template_name = "users/password_reset_form.html"
    email_template_name = "users/password_reset_email.txt"
    subject_template_name = "users/password_reset_subject.txt"
    success_url = reverse_lazy("password_reset_done")


class FEEMAASPasswordResetDoneView(PasswordResetDoneView):
    template_name = "users/password_reset_done.html"


class FEEMAASPasswordResetConfirmView(PasswordResetConfirmView):
    template_name = "users/password_reset_confirm.html"
    success_url = reverse_lazy("password_reset_complete")


class FEEMAASPasswordResetCompleteView(PasswordResetCompleteView):
    template_name = "users/password_reset_complete.html"
