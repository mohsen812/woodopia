import json

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from access.models import AccessRequest
from access.services import approve_access_request
from organizations.models import Organization, Membership


User = get_user_model()


class CollaborationRequestAPITests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="customer_test",
            email="customer_test@example.com",
            password="Test-password-123!",
        )
        self.other_user = User.objects.create_user(
            username="customer_other",
            email="customer_other@example.com",
            password="Test-password-456!",
        )

        self.create_url = reverse("create_collaboration_request")
        self.list_url = reverse("collaboration_requests")

        self.client.force_login(self.user)

    def post_request(self, **overrides):
        data = {
            "requested_type": "workshop",
            "organization_name": "کارگاه آزمایشی",
            "message": "درخواست همکاری آزمایشی",
            "social_network": "instagram",
            "social_profile": "https://www.instagram.com/example",
        }
        data.update(overrides)

        return self.client.post(
            self.create_url,
            data=json.dumps(data),
            content_type="application/json",
        )

    def test_create_request_does_not_create_organization_or_membership(self):
        response = self.post_request()

        self.assertEqual(response.status_code, 201)
        self.assertEqual(AccessRequest.objects.count(), 1)

        item = AccessRequest.objects.get()
        self.assertEqual(item.user, self.user)
        self.assertEqual(item.status, "pending")
        self.assertEqual(item.requested_type, "workshop")
        self.assertEqual(
            item.social_profile,
            "https://www.instagram.com/example",
        )

        self.assertEqual(Organization.objects.count(), 0)
        self.assertEqual(Membership.objects.count(), 0)

    def test_duplicate_pending_request_returns_409(self):
        first_response = self.post_request()
        self.assertEqual(first_response.status_code, 201)

        second_response = self.post_request(
            organization_name="کارگاه دوم",
        )

        self.assertEqual(second_response.status_code, 409)
        self.assertEqual(AccessRequest.objects.count(), 1)
        self.assertEqual(Organization.objects.count(), 0)
        self.assertEqual(Membership.objects.count(), 0)

    def test_request_history_contains_only_current_users_requests(self):
        own_request = AccessRequest.objects.create(
            user=self.user,
            requested_type="workshop",
            organization_name="کارگاه خودم",
        )
        AccessRequest.objects.create(
            user=self.other_user,
            requested_type="designer",
            organization_name="مجموعه کاربر دیگر",
        )

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, 200)
        payload = response.json()

        self.assertEqual(len(payload["requests"]), 1)
        self.assertEqual(
            payload["requests"][0]["id"],
            own_request.pk,
        )

    def test_create_endpoint_requires_authentication(self):
        self.client.logout()

        response = self.post_request()

        self.assertIn(response.status_code, (302, 401, 403))


class ApproveAccessRequestTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="workshop_applicant",
            email="workshop_applicant@example.com",
            password="Test-password-123!",
        )
        self.reviewer = User.objects.create_user(
            username="operations_reviewer",
            email="operations_reviewer@example.com",
            password="Test-password-456!",
        )

        self.access_request = AccessRequest.objects.create(
            user=self.user,
            requested_type="workshop",
            organization_name="کارگاه تأیید آزمایشی",
            status="pending",
        )

    def test_approval_creates_organization_and_membership(self):
        approved_request = approve_access_request(
            self.access_request.pk,
            self.reviewer,
        )

        self.assertEqual(approved_request.status, "approved")
        self.assertEqual(approved_request.reviewed_by, self.reviewer)
        self.assertIsNotNone(approved_request.reviewed_at)

        self.assertEqual(Organization.objects.count(), 1)
        self.assertEqual(Membership.objects.count(), 1)

        organization = approved_request.created_organization
        membership = approved_request.created_membership

        self.assertIsNotNone(organization)
        self.assertEqual(organization.name, "کارگاه تأیید آزمایشی")
        self.assertEqual(organization.organization_type, "workshop")
        self.assertEqual(organization.owner, self.user)

        self.assertIsNotNone(membership)
        self.assertEqual(membership.user, self.user)
        self.assertEqual(membership.organization, organization)
        self.assertEqual(membership.role, "owner")
        self.assertEqual(membership.status, "active")

    def test_approved_request_is_not_processed_twice(self):
        first_result = approve_access_request(
            self.access_request.pk,
            self.reviewer,
        )

        second_reviewer = User.objects.create_user(
            username="second_reviewer",
            email="second_reviewer@example.com",
            password="Test-password-789!",
        )

        second_result = approve_access_request(
            self.access_request.pk,
            second_reviewer,
        )

        self.assertEqual(first_result.status, "approved")
        self.assertEqual(second_result.status, "approved")
        self.assertEqual(second_result.reviewed_by, self.reviewer)
        self.assertEqual(Organization.objects.count(), 1)
        self.assertEqual(Membership.objects.count(), 1)
