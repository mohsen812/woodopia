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

class WorkshopStatusManagementTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        from organizations.models import Organization

        User = get_user_model()

        cls.operations_user = User.objects.create_user(
            username="workshop_operations",
            email="workshop_operations@example.com",
            password="Test-password-482!",
        )
        cls.normal_user = User.objects.create_user(
            username="workshop_normal",
            email="workshop_normal@example.com",
            password="Test-password-482!",
        )

        group = Group.objects.create(name="FEEMAAS Operations")
        cls.operations_user.groups.add(group)

        cls.active_workshop = Organization.objects.create(
            name="کارگاه فعال تست",
            organization_type="workshop",
            status="active",
            owner=cls.normal_user,
        )
        cls.suspended_workshop = Organization.objects.create(
            name="کارگاه تعلیق‌شده تست",
            organization_type="workshop",
            status="suspended",
            owner=cls.normal_user,
        )
        cls.customer_organization = Organization.objects.create(
            name="مشتری تست",
            organization_type="customer",
            status="active",
            owner=cls.normal_user,
        )

    def status_url(self, organization):
        return reverse(
            "operations:change_workshop_status",
            args=[organization.pk],
        )

    def test_operations_user_can_suspend_workshop_and_audit_is_created(self):
        from operations.models import WorkshopStatusLog

        self.client.force_login(self.operations_user)

        response = self.client.post(
            self.status_url(self.active_workshop),
            {
                "status": "suspended",
                "reason": "بررسی و تعلیق آزمایشی",
            },
        )

        self.assertEqual(response.status_code, 302)
        self.active_workshop.refresh_from_db()
        self.assertEqual(self.active_workshop.status, "suspended")

        log = WorkshopStatusLog.objects.get(
            organization=self.active_workshop,
        )
        self.assertEqual(log.previous_status, "active")
        self.assertEqual(log.new_status, "suspended")
        self.assertEqual(log.changed_by, self.operations_user)
        self.assertEqual(log.reason, "بررسی و تعلیق آزمایشی")

    def test_operations_user_can_reactivate_workshop(self):
        from operations.models import WorkshopStatusLog

        self.client.force_login(self.operations_user)

        response = self.client.post(
            self.status_url(self.suspended_workshop),
            {
                "status": "active",
                "reason": "رفع مانع عملیاتی",
            },
        )

        self.assertEqual(response.status_code, 302)
        self.suspended_workshop.refresh_from_db()
        self.assertEqual(self.suspended_workshop.status, "active")

        log = WorkshopStatusLog.objects.get(
            organization=self.suspended_workshop,
        )
        self.assertEqual(log.previous_status, "suspended")
        self.assertEqual(log.new_status, "active")
        self.assertEqual(log.reason, "رفع مانع عملیاتی")

    def test_empty_reason_does_not_change_status_or_create_log(self):
        from operations.models import WorkshopStatusLog

        self.client.force_login(self.operations_user)

        response = self.client.post(
            self.status_url(self.active_workshop),
            {"status": "suspended", "reason": "   "},
        )

        self.assertEqual(response.status_code, 302)
        self.active_workshop.refresh_from_db()
        self.assertEqual(self.active_workshop.status, "active")
        self.assertFalse(
            WorkshopStatusLog.objects.filter(
                organization=self.active_workshop,
            ).exists()
        )

    def test_reason_longer_than_500_characters_is_rejected(self):
        from operations.models import WorkshopStatusLog

        self.client.force_login(self.operations_user)

        response = self.client.post(
            self.status_url(self.active_workshop),
            {
                "status": "suspended",
                "reason": "x" * 501,
            },
        )

        self.assertEqual(response.status_code, 302)
        self.active_workshop.refresh_from_db()
        self.assertEqual(self.active_workshop.status, "active")
        self.assertFalse(
            WorkshopStatusLog.objects.filter(
                organization=self.active_workshop,
            ).exists()
        )

    def test_same_status_does_not_create_duplicate_log(self):
        from operations.models import WorkshopStatusLog

        self.client.force_login(self.operations_user)

        response = self.client.post(
            self.status_url(self.active_workshop),
            {
                "status": "active",
                "reason": "درخواست تکراری",
            },
        )

        self.assertEqual(response.status_code, 302)
        self.active_workshop.refresh_from_db()
        self.assertEqual(self.active_workshop.status, "active")
        self.assertFalse(
            WorkshopStatusLog.objects.filter(
                organization=self.active_workshop,
            ).exists()
        )

    def test_normal_user_cannot_change_workshop_status(self):
        from operations.models import WorkshopStatusLog

        self.client.force_login(self.normal_user)

        response = self.client.post(
            self.status_url(self.active_workshop),
            {
                "status": "suspended",
                "reason": "تلاش غیرمجاز",
            },
        )

        self.assertEqual(response.status_code, 403)
        self.active_workshop.refresh_from_db()
        self.assertEqual(self.active_workshop.status, "active")
        self.assertFalse(
            WorkshopStatusLog.objects.filter(
                organization=self.active_workshop,
            ).exists()
        )

    def test_customer_organization_cannot_be_changed_through_workshop_route(self):
        from operations.models import WorkshopStatusLog

        self.client.force_login(self.operations_user)

        response = self.client.post(
            self.status_url(self.customer_organization),
            {
                "status": "suspended",
                "reason": "نباید اعمال شود",
            },
        )

        self.assertEqual(response.status_code, 404)
        self.customer_organization.refresh_from_db()
        self.assertEqual(self.customer_organization.status, "active")
        self.assertFalse(
            WorkshopStatusLog.objects.filter(
                organization=self.customer_organization,
            ).exists()
        )

class WorkshopTenderAvailabilityTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        from organizations.models import Organization

        User = get_user_model()

        cls.operations_user = User.objects.create_user(
            username="availability_operations",
            email="availability_operations@example.com",
            password="Test-password-482!",
        )
        cls.normal_user = User.objects.create_user(
            username="availability_normal",
            email="availability_normal@example.com",
            password="Test-password-482!",
        )

        group = Group.objects.create(name="FEEMAAS Operations")
        cls.operations_user.groups.add(group)

        cls.active_workshop = Organization.objects.create(
            name="کارگاه فعال دسترس‌پذیری",
            organization_type="workshop",
            status="active",
            owner=cls.normal_user,
            is_tender_available=True,
        )
        cls.suspended_workshop = Organization.objects.create(
            name="کارگاه تعلیق‌شده دسترس‌پذیری",
            organization_type="workshop",
            status="suspended",
            owner=cls.normal_user,
            is_tender_available=True,
        )
        cls.customer_organization = Organization.objects.create(
            name="مشتری دسترس‌پذیری",
            organization_type="customer",
            status="active",
            owner=cls.normal_user,
        )

    def availability_url(self, organization):
        return reverse(
            "operations:change_workshop_tender_availability",
            args=[organization.pk],
        )

    def test_operations_user_can_disable_new_tender_invitations(self):
        from operations.models import TenderAvailabilityLog

        self.client.force_login(self.operations_user)

        response = self.client.post(
            self.availability_url(self.active_workshop),
            {"is_tender_available": "false"},
        )

        self.assertEqual(response.status_code, 302)
        self.active_workshop.refresh_from_db()
        self.assertFalse(self.active_workshop.is_tender_available)
        self.assertEqual(self.active_workshop.status, "active")

        log = TenderAvailabilityLog.objects.get(
            organization=self.active_workshop,
        )
        self.assertTrue(log.previous_available)
        self.assertFalse(log.new_available)
        self.assertEqual(log.changed_by, self.operations_user)

    def test_availability_can_change_independently_for_suspended_workshop(self):
        from operations.models import TenderAvailabilityLog

        self.client.force_login(self.operations_user)

        response = self.client.post(
            self.availability_url(self.suspended_workshop),
            {"is_tender_available": "false"},
        )

        self.assertEqual(response.status_code, 302)
        self.suspended_workshop.refresh_from_db()
        self.assertEqual(self.suspended_workshop.status, "suspended")
        self.assertFalse(self.suspended_workshop.is_tender_available)
        self.assertTrue(
            TenderAvailabilityLog.objects.filter(
                organization=self.suspended_workshop,
            ).exists()
        )

    def test_same_availability_does_not_create_duplicate_log(self):
        from operations.models import TenderAvailabilityLog

        self.client.force_login(self.operations_user)

        response = self.client.post(
            self.availability_url(self.active_workshop),
            {"is_tender_available": "true"},
        )

        self.assertEqual(response.status_code, 302)
        self.active_workshop.refresh_from_db()
        self.assertTrue(self.active_workshop.is_tender_available)
        self.assertFalse(
            TenderAvailabilityLog.objects.filter(
                organization=self.active_workshop,
            ).exists()
        )

    def test_normal_user_cannot_change_tender_availability(self):
        from operations.models import TenderAvailabilityLog

        self.client.force_login(self.normal_user)

        response = self.client.post(
            self.availability_url(self.active_workshop),
            {"is_tender_available": "false"},
        )

        self.assertEqual(response.status_code, 403)
        self.active_workshop.refresh_from_db()
        self.assertTrue(self.active_workshop.is_tender_available)
        self.assertFalse(
            TenderAvailabilityLog.objects.filter(
                organization=self.active_workshop,
            ).exists()
        )

    def test_customer_organization_cannot_use_workshop_availability_route(self):
        from operations.models import TenderAvailabilityLog

        self.client.force_login(self.operations_user)

        response = self.client.post(
            self.availability_url(self.customer_organization),
            {"is_tender_available": "false"},
        )

        self.assertEqual(response.status_code, 404)
        self.customer_organization.refresh_from_db()
        self.assertFalse(
            TenderAvailabilityLog.objects.filter(
                organization=self.customer_organization,
            ).exists()
        )

    def test_invalid_value_is_rejected_without_changing_workshop(self):
        from operations.models import TenderAvailabilityLog

        self.client.force_login(self.operations_user)

        response = self.client.post(
            self.availability_url(self.active_workshop),
            {"is_tender_available": "yes"},
        )

        self.assertEqual(response.status_code, 302)
        self.active_workshop.refresh_from_db()
        self.assertTrue(self.active_workshop.is_tender_available)
        self.assertFalse(
            TenderAvailabilityLog.objects.filter(
                organization=self.active_workshop,
            ).exists()
        )
