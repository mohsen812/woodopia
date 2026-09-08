from django.test import TestCase
from django.contrib.auth import get_user_model

from organizations.models import (
    Organization,
    OrganizationRole,
    Membership,
)

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

    def test_workspace_identity_contains_user_and_primary_workspace(self):
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

        self.assertIsNotNone(
            identity["primary_workspace"]
        )

        self.assertEqual(
            identity["primary_workspace"]["organization_id"],
            self.organization.id,
        )

        self.assertEqual(
            len(identity["workspaces"]),
            1,
        )

    def test_user_without_membership_has_no_primary_workspace(self):
        identity = get_workspace_identity(self.user)

        self.assertIsNone(
            identity["primary_workspace"]
        )

        self.assertEqual(
            identity["workspaces"],
            [],
        )
class WorkspaceIdentityAPITests(TestCase):

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

        self.assertIsNotNone(
            data["primary_workspace"]
        )

        self.assertEqual(
            data["primary_workspace"]["organization_name"],
            "API Customer Organization",
        )

        self.assertEqual(
            data["primary_workspace"]["type"],
            "customer",
        )

        self.assertEqual(
            data["primary_workspace"]["role"],
            "owner",
        )

        self.assertEqual(
            len(data["workspaces"]),
            1,
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

