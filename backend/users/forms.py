from django import forms
from django.contrib.auth.forms import AuthenticationForm


class UserLoginForm(AuthenticationForm):
    username = forms.CharField(
        label="ایمیل یا نام کاربری",
        widget=forms.TextInput(
            attrs={
                "class": "form-control",
                "placeholder": "ایمیل یا نام کاربری",
                "autocomplete": "username",
            }
        ),
    )

    password = forms.CharField(
        label="رمز عبور",
        widget=forms.PasswordInput(
            attrs={
                "class": "form-control",
                "placeholder": "رمز عبور",
                "autocomplete": "current-password",
            }
        ),
    )