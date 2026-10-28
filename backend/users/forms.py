from django import forms
from django.contrib.auth import password_validation
from django.contrib.auth.forms import AuthenticationForm
from django.core.exceptions import ValidationError

from .models import User


class UserLoginForm(AuthenticationForm):
    username = forms.CharField(
        label="ایمیل یا نام کاربری",
        widget=forms.TextInput(attrs={
            "class": "form-control",
            "placeholder": "ایمیل یا نام کاربری",
            "autocomplete": "username",
        }),
    )

    password = forms.CharField(
        label="رمز عبور",
        widget=forms.PasswordInput(attrs={
            "class": "form-control",
            "placeholder": "رمز عبور",
            "autocomplete": "current-password",
        }),
    )


class CustomerRegistrationForm(forms.Form):
    first_name = forms.CharField(
        label="نام",
        max_length=150,
        widget=forms.TextInput(attrs={
            "class": "form-control",
            "autocomplete": "given-name",
        }),
    )

    last_name = forms.CharField(
        label="نام خانوادگی",
        max_length=150,
        widget=forms.TextInput(attrs={
            "class": "form-control",
            "autocomplete": "family-name",
        }),
    )

    email = forms.EmailField(
        label="ایمیل",
        max_length=254,
        widget=forms.EmailInput(attrs={
            "class": "form-control",
            "autocomplete": "email",
            "dir": "ltr",
        }),
    )

    password1 = forms.CharField(
        label="رمز عبور",
        widget=forms.PasswordInput(attrs={
            "class": "form-control",
            "autocomplete": "new-password",
        }),
    )

    password2 = forms.CharField(
        label="تکرار رمز عبور",
        widget=forms.PasswordInput(attrs={
            "class": "form-control",
            "autocomplete": "new-password",
        }),
    )

    def clean_email(self):
        email = self.cleaned_data["email"].strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise ValidationError("با این ایمیل قبلاً حساب ساخته شده است.")
        return email

    def clean(self):
        cleaned_data = super().clean()
        password1 = cleaned_data.get("password1")
        password2 = cleaned_data.get("password2")

        if password1 and password2 and password1 != password2:
            self.add_error("password2", "رمزهای عبور یکسان نیستند.")

        if password1:
            candidate = User(
                email=cleaned_data.get("email", ""),
                first_name=cleaned_data.get("first_name", "").strip(),
                last_name=cleaned_data.get("last_name", "").strip(),
            )
            try:
                password_validation.validate_password(password1, candidate)
            except ValidationError as exc:
                self.add_error("password1", exc)

        return cleaned_data
