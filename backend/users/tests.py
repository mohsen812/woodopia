from django.test import TestCase
from django.urls import reverse

from organizations.models import Membership, Organization
from .models import User


class CustomerRegistrationTests(TestCase):
    def registration_data(self, **overrides):
        data = {
            "first_name": "کاربر",
            "last_name": "آزمایشی",
            "email": "customer@example.com",
            "password1": "S3cure-Long-Password-482!",
            "password2": "S3cure-Long-Password-482!",
        }
        data.update(overrides)
        return data

    def test_customer_can_register_and_is_logged_in(self):
        response = self.client.post(
            reverse("register"),
            self.registration_data(),
        )

        self.assertRedirects(response, "/workspace/")
        user = User.objects.get(email="customer@example.com")
        self.assertEqual(user.first_name, "کاربر")
        self.assertEqual(user.last_name, "آزمایشی")
        self.assertTrue(user.check_password("S3cure-Long-Password-482!"))
        self.assertFalse(user.is_email_verified)
        self.assertTrue(self.client.session.get("_auth_user_id"))

        organization = Organization.objects.get(owner=user)
        self.assertEqual(organization.organization_type, "customer")
        self.assertEqual(organization.legal_type, "individual")
        self.assertTrue(organization.account_code)
        self.assertEqual(organization.name, organization.account_code)
        self.assertRegex(
            organization.account_code,
            r"^[A-Za-z]+-[0-9A-F]{4}$",
        )

        membership = Membership.objects.get(
            user=user,
            organization=organization,
        )
        self.assertEqual(membership.role, "owner")
        self.assertEqual(membership.status, "active")

    def test_duplicate_email_is_rejected(self):
        User.objects.create_user(
            username="existing",
            email="existing@example.com",
            password="Existing-password-482!",
        )

        response = self.client.post(
            reverse("register"),
            self.registration_data(
                email="EXISTING@example.com",
            ),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            User.objects.filter(email__iexact="existing@example.com").count(),
            1,
        )

    def test_password_mismatch_is_rejected(self):
        response = self.client.post(
            reverse("register"),
            self.registration_data(
                email="mismatch@example.com",
                password2="Different-password-482!",
            ),
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(
            User.objects.filter(email="mismatch@example.com").exists()
        )

    def test_authenticated_user_cannot_create_another_signup(self):
        user = User.objects.create_user(
            username="already",
            email="already@example.com",
            password="Existing-password-482!",
        )
        self.client.force_login(user)

        response = self.client.get(reverse("register"))

        self.assertRedirects(response, "/")
