from django.conf import settings
import uuid

from django.contrib.auth import login, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth.views import (
    LoginView,
    PasswordResetView,
    PasswordResetDoneView,
    PasswordResetConfirmView,
    PasswordResetCompleteView,
)
from django.contrib import messages
from django.core.cache import cache
from django.http import HttpResponse, HttpResponseBadRequest
from django.db import IntegrityError, transaction
from django.shortcuts import redirect, render
from django.urls import reverse_lazy
from django.views.decorators.debug import sensitive_post_parameters
from django.views.decorators.http import require_POST
from django.utils.decorators import method_decorator

from organizations.models import Membership, Organization, OrganizationRole
from .forms import CustomerRegistrationForm, UserLoginForm
from .account_forms import CustomerProfileForm
from .models import User
from .services import get_user_landing_page


def _auth_rate_key(scope, value):
    import hashlib
    digest = hashlib.sha256(value.encode("utf-8")).hexdigest()
    return "feemaas:auth:{}:{}".format(scope, digest)


def _rate_count(key, window):
    if cache.add(key, 1, timeout=window):
        return 1
    try:
        return cache.incr(key)
    except ValueError:
        cache.add(key, 1, timeout=window)
        return 1


def _client_ip(request):
    return request.META.get("REMOTE_ADDR", "unknown")


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

    def _login_rate_key(self):
        identifier = (self.request.POST.get("username") or "").strip().lower()
        value = "{}|{}".format(identifier, _client_ip(self.request))
        return _auth_rate_key("login", value)

    def form_valid(self, form):
        cache.delete(self._login_rate_key())
        response = super().form_valid(form)
        if form.cleaned_data.get("remember_me"):
            self.request.session.set_expiry(60 * 60 * 24 * 30)
        else:
            self.request.session.set_expiry(0)
        return response

    def form_invalid(self, form):
        if form.cleaned_data.get("username") or self.request.POST.get("username"):
            _rate_count(self._login_rate_key(), 15 * 60)
        return super().form_invalid(form)

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
        if request.POST.get("auth_action") != "register":
            key = self._login_rate_key()
            if cache.get(key, 0) >= 10:
                return HttpResponse(
                    "تعداد تلاش‌های ورود بیش از حد مجاز است. ۱۵ دقیقه بعد دوباره تلاش کنید.",
                    status=429,
                )

        if request.POST.get("auth_action") == "register":
            if request.user.is_authenticated:
                return redirect(get_user_landing_page(request.user))

            if request.POST.get("website", "").strip():
                return HttpResponseBadRequest("درخواست نامعتبر است.")

            signup_key = _auth_rate_key("signup", _client_ip(request))
            if cache.get(signup_key, 0) >= 5:
                return HttpResponse(
                    "تعداد درخواست‌های ثبت‌نام بیش از حد مجاز است. یک ساعت بعد دوباره تلاش کنید.",
                    status=429,
                )
            _rate_count(signup_key, 60 * 60)

            register_form = CustomerRegistrationForm(request.POST)

            if register_form.is_valid():
                user = _create_customer_account(request, register_form)

                if user is not None:
                    login(
                        request,
                        user,
                        backend=settings.AUTHENTICATION_BACKENDS[0],
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
        if request.POST.get("website", "").strip():
            return HttpResponseBadRequest("درخواست نامعتبر است.")

        signup_key = _auth_rate_key("signup", _client_ip(request))
        if cache.get(signup_key, 0) >= 5:
            return HttpResponse(
                "تعداد درخواست‌های ثبت‌نام بیش از حد مجاز است. یک ساعت بعد دوباره تلاش کنید.",
                status=429,
            )
        _rate_count(signup_key, 60 * 60)

        form = CustomerRegistrationForm(request.POST)

        if form.is_valid():
            user = _create_customer_account(request, form)

            if user is not None:
                login(
                    request,
                    user,
                    backend=settings.AUTHENTICATION_BACKENDS[0],
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



@login_required
@require_POST
def customer_profile_update(request):
    form = CustomerProfileForm(
        request.POST,
        instance=request.user,
    )

    if form.is_valid():
        form.save()
        messages.success(
            request,
            "اطلاعات حساب با موفقیت ذخیره شد.",
        )
    else:
        for field_name, errors in form.errors.items():
            if field_name in form.fields:
                label = form.fields[field_name].label or field_name
            else:
                label = "اطلاعات حساب"

            for error in errors:
                messages.error(request, f"{label}: {error}")

    return redirect("/workspace/")


@login_required
@require_POST
@sensitive_post_parameters("old_password", "new_password1", "new_password2")
def customer_password_change(request):
    form = PasswordChangeForm(
        user=request.user,
        data=request.POST,
    )

    if form.is_valid():
        user = form.save()
        update_session_auth_hash(request, user)
        messages.success(
            request,
            "رمز عبور با موفقیت تغییر کرد.",
        )
    else:
        for field_name, errors in form.errors.items():
            if field_name in form.fields:
                label = form.fields[field_name].label or field_name
            else:
                label = "تغییر رمز عبور"

            for error in errors:
                messages.error(request, f"{label}: {error}")

    return redirect("/workspace/")
