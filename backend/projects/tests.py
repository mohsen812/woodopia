from django.contrib.auth import get_user_model
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
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
    ProjectAttachment,
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
        


    def test_customer_can_see_own_project_detail(self):

        project = Project.objects.create(
            title="Own Detail Project",
            description="Customer own project",
            customer=self.customer,
            created_by=self.user,
            status="draft",
        )

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.get(
            "/api/projects/{}/".format(project.id)
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            response.data["id"],
            project.id,
        )


    def test_customer_cannot_see_other_customer_project_detail(self):

        second_customer_user = User.objects.create_user(
            username="detail_other_customer",
            email="detail_other@example.com",
            password="testpass123",
        )

        second_customer = Organization.objects.create(
            name="Detail Other Customer",
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
            title="Other Customer Detail Project",
            description="Should not be visible",
            customer=second_customer,
            created_by=second_customer_user,
            status="draft",
        )

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.get(
            "/api/projects/{}/".format(other_project.id)
        )

        self.assertEqual(
            response.status_code,
            404,
        )


    def test_workshop_cannot_see_customer_project_detail(self):

        project = Project.objects.create(
            title="Workshop Hidden Project",
            description="Customer project",
            customer=self.customer,
            created_by=self.user,
            status="draft",
        )

        workshop_user = User.objects.create_user(
            username="detail_workshop",
            email="detail_workshop@example.com",
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
            "/api/projects/{}/".format(project.id)
        )

        self.assertEqual(
            response.status_code,
            404,
        )


    def test_user_without_customer_workspace_cannot_see_project_detail(self):

        project = Project.objects.create(
            title="No Workspace Project",
            description="Customer project",
            customer=self.customer,
            created_by=self.user,
            status="draft",
        )

        self.client.force_authenticate(
            user=self.other_user
        )

        response = self.client.get(
            "/api/projects/{}/".format(project.id)
        )

        self.assertEqual(
            response.status_code,
            404,
        )


    def test_customer_can_list_own_project_attachments(self):

        project = Project.objects.create(
            title="Own Attachment Project",
            description="Customer own project",
            customer=self.customer,
            created_by=self.user,
            status="draft",
        )

        ProjectAttachment.objects.create(
            project=project,
            uploaded_by=self.user,
            file="projects/test.txt",
            file_type="document",
            title="Test Document",
        )

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.get(
            "/api/projects/{}/attachments/".format(project.id)
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            len(response.data),
            1,
        )


    def test_customer_cannot_list_other_customer_attachments(self):

        second_customer_user = User.objects.create_user(
            username="attachment_other_customer",
            email="attachment_other@example.com",
            password="testpass123",
        )

        second_customer = Organization.objects.create(
            name="Attachment Other Customer",
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
            title="Other Attachment Project",
            customer=second_customer,
            created_by=second_customer_user,
            status="draft",
        )

        ProjectAttachment.objects.create(
            project=other_project,
            uploaded_by=second_customer_user,
            file="projects/other.txt",
            file_type="document",
            title="Other Document",
        )

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.get(
            "/api/projects/{}/attachments/".format(
                other_project.id
            )
        )

        self.assertEqual(
            response.status_code,
            404,
        )


    def test_workshop_cannot_list_customer_attachments(self):

        project = Project.objects.create(
            title="Workshop Hidden Attachment Project",
            customer=self.customer,
            created_by=self.user,
            status="draft",
        )

        ProjectAttachment.objects.create(
            project=project,
            uploaded_by=self.user,
            file="projects/customer.txt",
            file_type="document",
            title="Customer Document",
        )

        workshop_user = User.objects.create_user(
            username="attachment_workshop",
            email="attachment_workshop@example.com",
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
            "/api/projects/{}/attachments/".format(
                project.id
            )
        )

        self.assertEqual(
            response.status_code,
            404,
        )


    def test_customer_can_upload_attachment_to_own_project(self):

        project = Project.objects.create(
            title="Own Upload Project",
            customer=self.customer,
            created_by=self.user,
            status="draft",
        )

        self.client.force_authenticate(
            user=self.user
        )
        
        uploaded_file = SimpleUploadedFile(
            "upload.txt",
            b"test file content",
            content_type="text/plain",
        )
        
        response = self.client.post(
            "/api/projects/{}/attachments/".format(
                project.id
            ),
            {
                "file": uploaded_file,
                "file_type": "document",
                "title": "Uploaded Document",
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        attachment = ProjectAttachment.objects.get(
            project=project
        )

        self.assertEqual(
            attachment.project,
            project,
        )


    def test_customer_cannot_upload_attachment_to_other_project(self):

        second_customer_user = User.objects.create_user(
            username="attachment_upload_other",
            email="attachment_upload_other@example.com",
            password="testpass123",
        )

        second_customer = Organization.objects.create(
            name="Attachment Upload Other Customer",
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
            title="Protected Upload Project",
            customer=second_customer,
            created_by=second_customer_user,
            status="draft",
        )

        self.client.force_authenticate(
            user=self.user
        )
        uploaded_file = SimpleUploadedFile(
            "hacked.txt",
            b"should not be uploaded",
            content_type="text/plain",
        )
        response = self.client.post(
            "/api/projects/{}/attachments/".format(
                other_project.id
            ),
            {
                "file": uploaded_file,
                "file_type": "document",
                "title": "Should Not Upload",
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            404,
        )

        self.assertFalse(
            ProjectAttachment.objects.filter(
                project=other_project
            ).exists()
        )
    def test_project_title_is_required(self):

        self.client.force_authenticate(
            user=self.user
        )

        payload = {
            "description": "Project without title",
        }

        response = self.client.post(
            "/api/projects/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.assertIn(
            "title",
            response.data,
        )


    def test_customer_can_create_project_without_optional_fields(self):

        self.client.force_authenticate(
            user=self.user
        )

        payload = {
            "title": "Minimal Customer Project",
        }

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
            project.title,
            "Minimal Customer Project",
        )

        self.assertEqual(
            project.description,
            "",
        )

        self.assertIsNone(
            project.estimated_budget,
        )

        self.assertIsNone(
            project.required_delivery_days,
        )

        self.assertEqual(
            project.status,
            "draft",
        )

        self.assertEqual(
            project.customer,
            self.customer,
        )

        self.assertEqual(
            project.created_by,
            self.user,
        )


    def test_customer_cannot_set_location_during_create(self):

        self.client.force_authenticate(
            user=self.user
        )

        payload = {
            "title": "Location Protected Project",
            "location": "Tehran",
        }

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
            project.location,
            "",
        )


    def test_customer_can_create_project_with_optional_business_fields(self):

        self.client.force_authenticate(
            user=self.user
        )

        payload = {
            "title": "Full Customer Project",
            "description": "Dining table project",
            "estimated_budget": "150000000",
            "required_delivery_days": 30,
        }

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
            project.title,
            "Full Customer Project",
        )

        self.assertEqual(
            project.description,
            "Dining table project",
        )

        self.assertEqual(
            str(project.estimated_budget),
            "150000000.00",
        )

        self.assertEqual(
            project.required_delivery_days,
            30,
        )


    def test_customer_cannot_spoof_internal_capacity_slot(self):

        self.client.force_authenticate(
            user=self.user
        )

        payload = {
            "title": "Capacity Protected Project",
            "capacity_slot": 999,
        }

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

        visual = ProjectVisual.objects.get(
            project=project
        )

        self.assertEqual(
            visual.visual_data["capacity_slot"],
            999,
        )


    def test_attachment_upload_does_not_allow_uploaded_by_spoofing(self):

        project = Project.objects.create(
            title="Attachment Security Project",
            customer=self.customer,
            created_by=self.user,
            status="draft",
        )

        self.client.force_authenticate(
            user=self.user
        )

        uploaded_file = SimpleUploadedFile(
            "secure.txt",
            b"secure attachment",
            content_type="text/plain",
        )

        response = self.client.post(
            "/api/projects/{}/attachments/".format(
                project.id
            ),
            {
                "file": uploaded_file,
                "title": "Secure Attachment",
                "uploaded_by": self.other_user.id,
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        attachment = ProjectAttachment.objects.get(
            project=project
        )

        self.assertEqual(
            attachment.uploaded_by,
            self.user,
        )


    def test_attachment_file_type_is_optional_for_customer(self):

        project = Project.objects.create(
            title="Generic Attachment Project",
            customer=self.customer,
            created_by=self.user,
            status="draft",
        )

        self.client.force_authenticate(
            user=self.user
        )

        uploaded_file = SimpleUploadedFile(
            "generic.txt",
            b"generic attachment",
            content_type="text/plain",
        )

        response = self.client.post(
            "/api/projects/{}/attachments/".format(
                project.id
            ),
            {
                "file": uploaded_file,
                "title": "Generic Attachment",
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        attachment = ProjectAttachment.objects.get(
            project=project
        )

        self.assertEqual(
            attachment.file_type,
            "other",
        )

        self.assertEqual(
            attachment.uploaded_by,
            self.user,
        )
