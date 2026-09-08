from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from organizations.models import (
    Membership,
    Organization,
    OrganizationRole,
)

from .models import (
    Project,
    ProjectItem,
    ProjectZone,
    ProjectVisual,
)


User = get_user_model()


class ProjectCreateTests(TestCase):

    def setUp(self):

        self.client = APIClient()

        self.user = User.objects.create_user(
            username="customer_user",
            email="customer@example.com",
            password="testpass123",
        )

        self.other_user = User.objects.create_user(
            username="other_user",
            email="other@example.com",
            password="testpass123",
        )

        self.customer = Organization.objects.create(
            name="Test Customer",
            organization_type="customer",
            status="active",
            owner=self.user,
        )

        self.workshop = Organization.objects.create(
            name="Test Workshop",
            organization_type="workshop",
            status="active",
            owner=self.user,
        )

        self.customer_role = OrganizationRole.objects.create(
            name="owner",
            organization_type="customer",
        )

        Membership.objects.create(
            user=self.user,
            organization=self.customer,
            role_fk=self.customer_role,
            status="active",
        )


    def project_payload(self):

        return {
            "title": "Test Dining Table",
            "description": "A test project",
            "estimated_budget": "150000000",
            "required_delivery_days": 20,
            "location": "Tehran",
            "capacity_slot": 1,
        }


    def test_customer_can_create_project(self):

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.post(
            "/api/projects/",
            self.project_payload(),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        project = Project.objects.get(
            id=response.data["id"]
        )

        self.assertEqual(
            project.customer,
            self.customer,
        )

        self.assertEqual(
            project.created_by,
            self.user,
        )

        self.assertEqual(
            project.status,
            "draft",
        )


    def test_project_initial_structure_is_created(self):

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.post(
            "/api/projects/",
            self.project_payload(),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        project = Project.objects.get(
            id=response.data["id"]
        )

        self.assertEqual(
            ProjectItem.objects.filter(
                project=project
            ).count(),
            1,
        )

        self.assertEqual(
            ProjectZone.objects.filter(
                project=project
            ).count(),
            1,
        )

        self.assertEqual(
            ProjectVisual.objects.filter(
                project=project
            ).count(),
            1,
        )


    def test_client_cannot_spoof_customer(self):

        self.client.force_authenticate(
            user=self.user
        )

        payload = self.project_payload()

        payload["customer"] = self.workshop.id

        response = self.client.post(
            "/api/projects/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        project = Project.objects.get(
            id=response.data["id"]
        )

        self.assertEqual(
            project.customer,
            self.customer,
        )


    def test_client_cannot_spoof_created_by(self):

        self.client.force_authenticate(
            user=self.user
        )

        payload = self.project_payload()

        payload["created_by"] = self.other_user.id

        response = self.client.post(
            "/api/projects/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        project = Project.objects.get(
            id=response.data["id"]
        )

        self.assertEqual(
            project.created_by,
            self.user,
        )


    def test_client_cannot_set_status(self):

        self.client.force_authenticate(
            user=self.user
        )

        payload = self.project_payload()

        payload["status"] = "completed"

        response = self.client.post(
            "/api/projects/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        project = Project.objects.get(
            id=response.data["id"]
        )

        self.assertEqual(
            project.status,
            "draft",
        )


    def test_non_customer_workspace_cannot_create_project(self):

        workshop_user = User.objects.create_user(
            username="workshop_user",
            email="workshop@example.com",
            password="testpass123",
        )

        Membership.objects.create(
            user=workshop_user,
            organization=self.workshop,
            status="active",
        )

        self.client.force_authenticate(
            user=workshop_user
        )

        response = self.client.post(
            "/api/projects/",
            self.project_payload(),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.assertEqual(
            Project.objects.count(),
            0,
        )


    def test_user_without_customer_workspace_cannot_create_project(self):

        self.client.force_authenticate(
            user=self.other_user
        )

        response = self.client.post(
            "/api/projects/",
            self.project_payload(),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.assertEqual(
            Project.objects.count(),
            0,
        )


    def test_inactive_customer_workspace_cannot_create_project(self):

        Membership.objects.filter(
            user=self.user,
            organization=self.customer,
        ).update(
            status="inactive"
        )

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.post(
            "/api/projects/",
            self.project_payload(),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.assertEqual(
            Project.objects.count(),
            0,
        )


    def test_multiple_customer_workspaces_are_rejected(self):

        second_customer = Organization.objects.create(
            name="Second Customer",
            organization_type="customer",
            status="active",
            owner=self.user,
        )

        Membership.objects.create(
            user=self.user,
            organization=second_customer,
            status="active",
        )

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.post(
            "/api/projects/",
            self.project_payload(),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.assertEqual(
            Project.objects.count(),
            0,
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


    def test_workshop_cannot_see_customer_projects(self):

        customer_project = Project.objects.create(
            title="Customer Project",
            description="Private customer project",
            customer=self.customer,
            created_by=self.user,
            status="draft",
        )

        workshop_user = User.objects.create_user(
            username="workshop_viewer",
            email="workshop_viewer@example.com",
            password="testpass123",
        )

        Membership.objects.create(
            user=workshop_user,
            organization=self.workshop,
            status="active",
        )

        self.client.force_authenticate(
            user=workshop_user
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
            customer_project.id,
            project_ids,
        )


    def test_user_without_customer_workspace_sees_no_projects(self):

        customer_project = Project.objects.create(
            title="Customer Project",
            description="Private customer project",
            customer=self.customer,
            created_by=self.user,
            status="draft",
        )

        self.client.force_authenticate(
            user=self.other_user
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
            customer_project.id,
            project_ids,
        )
        
