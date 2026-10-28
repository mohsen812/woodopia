from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.test import TestCase
from django.urls import reverse


class OperationsDashboardAccessTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        User = get_user_model()

        cls.operations_user = User.objects.create_user(
            username="operations_test",
            email="operations_test@example.com",
            password="Test-password-482!",
        )
        cls.normal_user = User.objects.create_user(
            username="normal_test",
            email="normal_test@example.com",
            password="Test-password-482!",
        )

        cls.operations_group = Group.objects.create(
            name="FEEMAAS Operations",
        )
        cls.operations_user.groups.add(cls.operations_group)

    def test_anonymous_user_is_redirected_to_login(self):
        response = self.client.get(reverse("operations:dashboard"))

        self.assertEqual(response.status_code, 302)
        self.assertIn("/accounts/login/", response.url)

    def test_operations_group_member_can_open_dashboard(self):
        self.client.force_login(self.operations_user)

        response = self.client.get(reverse("operations:dashboard"))

        self.assertEqual(response.status_code, 200)

    def test_normal_user_is_forbidden(self):
        self.client.force_login(self.normal_user)

        response = self.client.get(reverse("operations:dashboard"))

        self.assertEqual(response.status_code, 403)

    def test_operations_login_redirects_to_dashboard(self):
        response = self.client.post(
            reverse("login"),
            {
                "username": "operations_test",
                "password": "Test-password-482!",
                "next": "/workspace/",
            },
        )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, "/operations/")

    def test_normal_user_login_keeps_existing_landing_page(self):
        response = self.client.post(
            reverse("login"),
            {
                "username": "normal_test",
                "password": "Test-password-482!",
                "next": "/workspace/",
            },
        )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, "/")
