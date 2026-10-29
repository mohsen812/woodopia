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

class CustomerAccountTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="account-customer",
            email="account@example.com",
            password="Current-Secure-Password-482!",
            first_name="نام",
            last_name="آزمایشی",
            phone="09120000000",
            is_email_verified=True,
        )

        organization = Organization.objects.create(
            name="Test Customer",
            organization_type="customer",
            legal_type="individual",
            status="active",
            owner=self.user,
        )

        Membership.objects.create(
            user=self.user,
            organization=organization,
            role="owner",
            status="active",
        )

        self.client.force_login(self.user)

    def test_profile_can_be_updated(self):
        response = self.client.post(
            "/users/profile/",
            {
                "first_name": "نام جدید",
                "last_name": "نام خانوادگی جدید",
                "email": "new-account@example.com",
                "phone": "09121111111",
            },
        )

        self.assertRedirects(response, "/workspace/")
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "نام جدید")
        self.assertEqual(self.user.last_name, "نام خانوادگی جدید")
        self.assertEqual(self.user.email, "new-account@example.com")
        self.assertEqual(self.user.phone, "09121111111")
        self.assertFalse(self.user.is_email_verified)

    def test_profile_rejects_duplicate_email(self):
        User.objects.create_user(
            username="another-customer",
            email="other@example.com",
            password="Other-Secure-Password-482!",
        )

        response = self.client.post(
            "/users/profile/",
            {
                "first_name": "نام",
                "last_name": "آزمایشی",
                "email": "OTHER@example.com",
                "phone": "09120000000",
            },
            follow=True,
        )

        self.assertRedirects(response, "/workspace/")
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, "account@example.com")
        self.assertContains(response, "این ایمیل قبلاً برای حساب دیگری ثبت شده است.")

    def test_profile_keeps_email_verification_if_email_is_unchanged(self):
        response = self.client.post(
            "/users/profile/",
            {
                "first_name": self.user.first_name,
                "last_name": self.user.last_name,
                "email": "ACCOUNT@example.com",
                "phone": self.user.phone,
            },
        )

        self.assertRedirects(response, "/workspace/")
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, "account@example.com")
        self.assertTrue(self.user.is_email_verified)

    def test_password_can_be_changed_and_session_is_preserved(self):
        response = self.client.post(
            "/users/password-change/",
            {
                "old_password": "Current-Secure-Password-482!",
                "new_password1": "New-Secure-Password-937!x",
                "new_password2": "New-Secure-Password-937!x",
            },
        )

        self.assertRedirects(response, "/workspace/")
        self.user.refresh_from_db()
        self.assertTrue(
            self.user.check_password("New-Secure-Password-937!x")
        )
        self.assertTrue(self.client.session.get("_auth_user_id"))

        session_response = self.client.get("/users/profile/")
        self.assertEqual(session_response.status_code, 405)

    def test_password_change_rejects_wrong_current_password(self):
        response = self.client.post(
            "/users/password-change/",
            {
                "old_password": "Wrong-Current-Password-482!",
                "new_password1": "New-Secure-Password-937!x",
                "new_password2": "New-Secure-Password-937!x",
            },
            follow=True,
        )

        self.assertRedirects(response, "/workspace/")
        self.user.refresh_from_db()
        self.assertTrue(
            self.user.check_password("Current-Secure-Password-482!")
        )
        self.assertContains(response, "رمز عبور فعلی")

    def test_account_endpoints_require_login(self):
        self.client.logout()

        profile_response = self.client.post(
            "/users/profile/",
            {
                "first_name": "تغییر",
                "last_name": "غیرمجاز",
                "email": "account@example.com",
                "phone": "",
            },
        )
        password_response = self.client.post(
            "/users/password-change/",
            {
                "old_password": "Current-Secure-Password-482!",
                "new_password1": "New-Secure-Password-937!x",
                "new_password2": "New-Secure-Password-937!x",
            },
        )

        self.assertEqual(profile_response.status_code, 302)
        self.assertEqual(password_response.status_code, 302)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "نام")
