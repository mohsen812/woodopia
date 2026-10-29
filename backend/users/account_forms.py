from django import forms

from .models import User


class CustomerProfileForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ("first_name", "last_name", "email", "phone")
        labels = {
            "first_name": "نام",
            "last_name": "نام خانوادگی",
            "email": "ایمیل",
            "phone": "شماره تلفن",
        }
        widgets = {
            "first_name": forms.TextInput(
                attrs={"autocomplete": "given-name"}
            ),
            "last_name": forms.TextInput(
                attrs={"autocomplete": "family-name"}
            ),
            "email": forms.EmailInput(
                attrs={"autocomplete": "email", "dir": "ltr"}
            ),
            "phone": forms.TextInput(
                attrs={"autocomplete": "tel", "dir": "ltr"}
            ),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.original_email = (
            (self.instance.email or "").strip().lower()
        )

    def clean_email(self):
        email = self.cleaned_data["email"].strip().lower()

        duplicates = User.objects.filter(
            email__iexact=email
        ).exclude(pk=self.instance.pk)

        if duplicates.exists():
            raise forms.ValidationError(
                "این ایمیل قبلاً برای حساب دیگری ثبت شده است."
            )

        return email

    def save(self, commit=True):
        user = super().save(commit=False)
        new_email = user.email.strip().lower()

        if new_email != self.original_email:
            user.is_email_verified = False

        user.email = new_email

        if commit:
            user.save()

        return user
