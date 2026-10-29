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


class AccessRequestReviewEndpointTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        from access.models import AccessRequest

        User = get_user_model()

        cls.operations_user = User.objects.create_user(
            username="review_operations",
            email="review_operations@example.com",
            password="Test-password-482!",
        )
        cls.normal_user = User.objects.create_user(
            username="review_normal",
            email="review_normal@example.com",
            password="Test-password-482!",
        )

        group = Group.objects.create(name="FEEMAAS Operations")
        cls.operations_user.groups.add(group)

        cls.applicant = User.objects.create_user(
            username="review_applicant",
            email="review_applicant@example.com",
            password="Test-password-482!",
        )

        cls.access_request = AccessRequest.objects.create(
            user=cls.applicant,
            requested_type="workshop",
            organization_name="کارگاه تست عملیات",
            status="pending",
        )

    def review_url(self):
        return reverse(
            "operations:review_access_request",
            args=[self.access_request.pk],
        )

    def test_operations_user_can_approve_request(self):
        from access.models import AccessRequest
        from organizations.models import Organization, Membership

        self.client.force_login(self.operations_user)

        response = self.client.post(
            self.review_url(),
            {"action": "approve"},
        )

        self.assertEqual(response.status_code, 302)

        self.access_request.refresh_from_db()
        self.assertEqual(self.access_request.status, "approved")
        self.assertEqual(
            self.access_request.reviewed_by,
            self.operations_user,
        )
        self.assertIsNotNone(self.access_request.reviewed_at)
        self.assertEqual(Organization.objects.count(), 1)
        self.assertEqual(Membership.objects.count(), 1)
        self.assertIsNotNone(self.access_request.created_organization)
        self.assertIsNotNone(self.access_request.created_membership)

    def test_operations_user_can_reject_request_without_creating_access(self):
        from organizations.models import Organization, Membership

        self.client.force_login(self.operations_user)

        response = self.client.post(
            self.review_url(),
            {"action": "reject"},
        )

        self.assertEqual(response.status_code, 302)

        self.access_request.refresh_from_db()
        self.assertEqual(self.access_request.status, "rejected")
        self.assertEqual(
            self.access_request.reviewed_by,
            self.operations_user,
        )
        self.assertIsNotNone(self.access_request.reviewed_at)
        self.assertEqual(Organization.objects.count(), 0)
        self.assertEqual(Membership.objects.count(), 0)

    def test_normal_user_cannot_review_request(self):
        from access.models import AccessRequest
        from organizations.models import Organization, Membership

        self.client.force_login(self.normal_user)

        response = self.client.post(
            self.review_url(),
            {"action": "approve"},
        )

        self.assertEqual(response.status_code, 403)

        self.access_request.refresh_from_db()
        self.assertEqual(self.access_request.status, "pending")
        self.assertEqual(Organization.objects.count(), 0)
        self.assertEqual(Membership.objects.count(), 0)

    def test_already_reviewed_request_cannot_be_approved_again(self):
        from access.models import AccessRequest
        from organizations.models import Organization, Membership

        self.client.force_login(self.operations_user)

        first_response = self.client.post(
            self.review_url(),
            {"action": "reject"},
        )
        self.assertEqual(first_response.status_code, 302)

        second_response = self.client.post(
            self.review_url(),
            {"action": "approve"},
        )
        self.assertEqual(second_response.status_code, 302)

        self.access_request.refresh_from_db()
        self.assertEqual(self.access_request.status, "rejected")
        self.assertEqual(Organization.objects.count(), 0)
        self.assertEqual(Membership.objects.count(), 0)
