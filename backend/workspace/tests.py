from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

from organizations.models import (
    Organization,
    OrganizationRole,
    Membership,
)

from projects.models import Project

from .services import (
    get_user_workspaces,
    get_workspace_identity,
)


User = get_user_model()


class WorkspaceIdentityServiceTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="customer1",
            email="customer@example.com",
            password="testpass123",
        )

        self.organization = Organization.objects.create(
            name="Customer Organization",
            organization_type="customer",
            owner=self.user,
        )

        self.role = OrganizationRole.objects.create(
            name="owner",
            organization_type="customer",
        )

    def test_active_membership_returns_workspace(self):
        Membership.objects.create(
            user=self.user,
            organization=self.organization,
            role_fk=self.role,
            status="active",
        )

        workspaces = get_user_workspaces(self.user)

        self.assertEqual(len(workspaces), 1)

        self.assertEqual(
            workspaces[0]["organization_id"],
            self.organization.id,
        )

        self.assertEqual(
            workspaces[0]["organization_name"],
            "Customer Organization",
        )

        self.assertEqual(
            workspaces[0]["type"],
            "customer",
        )

        self.assertEqual(
            workspaces[0]["role"],
            "owner",
        )

    def test_inactive_membership_is_excluded(self):
        Membership.objects.create(
            user=self.user,
            organization=self.organization,
            role_fk=self.role,
            status="inactive",
        )

        workspaces = get_user_workspaces(self.user)

        self.assertEqual(workspaces, [])

    def test_role_fk_is_preferred_over_legacy_role(self):
        Membership.objects.create(
            user=self.user,
            organization=self.organization,
            role="member",
            role_fk=self.role,
            status="active",
        )

        workspaces = get_user_workspaces(self.user)

        self.assertEqual(
            workspaces[0]["role"],
            "owner",
        )

    def test_legacy_role_is_used_when_role_fk_is_missing(self):
        Membership.objects.create(
            user=self.user,
            organization=self.organization,
            role="member",
            role_fk=None,
            status="active",
        )

        workspaces = get_user_workspaces(self.user)

        self.assertEqual(
            workspaces[0]["role"],
            "member",
        )

    def test_workspace_identity_contains_user_and_no_implicit_primary_workspace(self):
        Membership.objects.create(
            user=self.user,
            organization=self.organization,
            role_fk=self.role,
            status="active",
        )

        identity = get_workspace_identity(self.user)

        self.assertEqual(
            identity["user"]["id"],
            self.user.id,
        )

        self.assertEqual(
            identity["user"]["username"],
            "customer1",
        )

        self.assertEqual(
            identity["user"]["email"],
            "customer@example.com",
        )

        self.assertIsNone(
            identity["active_workspace"]
        )

        self.assertEqual(
            len(identity["workspaces"]),
            1,
        )

        self.assertEqual(
            identity["workspaces"][0]["organization_id"],
            self.organization.id,
        )
    def test_user_without_membership_has_no_active_workspace(self):
        identity = get_workspace_identity(self.user)

        self.assertIsNone(
            identity["active_workspace"]
        )

        self.assertEqual(
            identity["workspaces"],
            [],
        )
class WorkspaceIdentityAPITests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="api_customer",
            email="api_customer@example.com",
            password="testpass123",
        )

        self.organization = Organization.objects.create(
            name="API Customer Organization",
            organization_type="customer",
            owner=self.user,
        )
        self.customer = self.organization

        self.role = OrganizationRole.objects.create(
            name="owner",
            organization_type="customer",
        )

        Membership.objects.create(
            user=self.user,
            organization=self.organization,
            role_fk=self.role,
            status="active",
        )

    def test_identity_requires_authentication(self):
        response = self.client.get(
            "/workspace/identity/"
        )

        self.assertEqual(
            response.status_code,
            302,
        )

    def test_identity_returns_workspace_identity(self):
        self.client.login(
            username="api_customer",
            password="testpass123",
        )

        response = self.client.get(
            "/workspace/identity/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        data = response.json()

        self.assertEqual(
            data["user"]["username"],
            "api_customer",
        )

        self.assertEqual(
            data["user"]["email"],
            "api_customer@example.com",
        )
        self.assertIsNone(
            data["active_workspace"]
        )

        self.assertEqual(
            len(data["workspaces"]),
            1,
        )

        self.assertEqual(
            data["workspaces"][0]["organization_name"],
            "API Customer Organization",
        )

        self.assertEqual(
            data["workspaces"][0]["type"],
            "customer",
        )

        self.assertEqual(
            data["workspaces"][0]["role"],
            "owner",
        )

    def test_customer_sees_own_projects_only(self):

        self.client.force_authenticate(
            user=self.user
        )

        own_project = Project.objects.create(
            title="Own Project",
            description="Customer own project",
            customer=self.customer,
            created_by=self.user,
            status="draft",
        )

        response = self.client.get(
            "/api/projects/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        project_ids = [
            project["id"]
            for project in response.data
        ]

        self.assertIn(
            own_project.id,
            project_ids,
        )


    def test_customer_cannot_see_other_customer_projects(self):

        second_customer_user = User.objects.create_user(
            username="second_customer",
            email="second_customer@example.com",
            password="testpass123",
        )

        second_customer = Organization.objects.create(
            name="Second Customer",
            organization_type="customer",
            status="active",
            owner=second_customer_user,
        )

        Membership.objects.create(
            user=second_customer_user,
            organization=second_customer,
            status="active",
        )

        other_project = Project.objects.create(
            title="Other Customer Project",
            description="Should not be visible",
            customer=second_customer,
            created_by=second_customer_user,
            status="draft",
        )

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.get(
            "/api/projects/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        project_ids = [
            project["id"]
            for project in response.data
        ]

        self.assertNotIn(
            other_project.id,
            project_ids,
        )

class WorkspaceContextTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="workspace_user",
            email="workspace@example.com",
            password="testpass123",
        )

        self.customer_org = Organization.objects.create(
            name="Customer Workspace",
            organization_type="customer",
            owner=self.user,
        )

        self.workshop_org = Organization.objects.create(
            name="Workshop Workspace",
            organization_type="workshop",
            owner=self.user,
        )

        self.customer_role = OrganizationRole.objects.create(
            name="owner",
            organization_type="customer",
        )

        self.workshop_role = OrganizationRole.objects.create(
            name="owner",
            organization_type="workshop",
        )

        self.customer_membership = Membership.objects.create(
            user=self.user,
            organization=self.customer_org,
            role_fk=self.customer_role,
            status="active",
        )

        self.workshop_membership = Membership.objects.create(
            user=self.user,
            organization=self.workshop_org,
            role_fk=self.workshop_role,
            status="active",
        )

    def login_user(self):
        return self.client.login(
            username="workspace_user",
            password="testpass123",
        )

    def test_multiple_memberships_show_gateway(self):
        self.assertTrue(
            self.login_user()
        )

        response = self.client.get(
            "/workspace/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertContains(
            response,
            "Customer Workspace",
        )

        self.assertContains(
            response,
            "Workshop Workspace",
        )

        self.assertNotIn(
            "active_membership_id",
            self.client.session,
        )

    def test_switch_requires_post(self):
        self.assertTrue(
            self.login_user()
        )

        response = self.client.get(
            "/workspace/switch/"
        )

        self.assertEqual(
            response.status_code,
            400,
        )

    def test_switch_requires_membership_id(self):
        self.assertTrue(
            self.login_user()
        )

        response = self.client.post(
            "/workspace/switch/",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

    def test_valid_switch_sets_active_membership(self):
        self.assertTrue(
            self.login_user()
        )

        response = self.client.post(
            "/workspace/switch/",
            {
                "membership_id": self.workshop_membership.id,
            },
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            self.client.session["active_membership_id"],
            self.workshop_membership.id,
        )

    def test_user_cannot_switch_to_another_users_membership(self):
        other_user = User.objects.create_user(
            username="other_workspace_user",
            email="other@example.com",
            password="testpass123",
        )

        other_org = Organization.objects.create(
            name="Other Organization",
            organization_type="customer",
            owner=other_user,
        )

        other_membership = Membership.objects.create(
            user=other_user,
            organization=other_org,
            status="active",
        )

        self.assertTrue(
            self.login_user()
        )

        response = self.client.post(
            "/workspace/switch/",
            {
                "membership_id": other_membership.id,
            },
        )

        self.assertEqual(
            response.status_code,
            403,
        )

        self.assertNotIn(
            "active_membership_id",
            self.client.session,
        )

    def test_inactive_membership_cannot_be_selected(self):
        self.workshop_membership.status = "inactive"
        self.workshop_membership.save(
            update_fields=["status"]
        )

        self.assertTrue(
            self.login_user()
        )

        response = self.client.post(
            "/workspace/switch/",
            {
                "membership_id": self.workshop_membership.id,
            },
        )

        self.assertEqual(
            response.status_code,
            403,
        )

        self.assertNotIn(
            "active_membership_id",
            self.client.session,
        )

    def test_selected_membership_is_used_on_workspace_entry(self):
        self.assertTrue(
            self.login_user()
        )

        session = self.client.session

        session["active_membership_id"] = (
            self.customer_membership.id
        )

        session.save()

        response = self.client.get(
            "/workspace/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            self.client.session["active_membership_id"],
            self.customer_membership.id,
        )

        self.assertTrue(
            any(
                template.name == "workspace/customer/index.html"
                for template in response.templates
            )
        )

    def test_stale_membership_session_is_cleared(self):
        self.assertTrue(
            self.login_user()
        )

        session = self.client.session

        session["active_membership_id"] = 999999

        session.save()

        response = self.client.get(
            "/workspace/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertNotIn(
            "active_membership_id",
            self.client.session,
        )

        self.assertContains(
            response,
            "Customer Workspace",
        )

        self.assertContains(
            response,
            "Workshop Workspace",
        )
