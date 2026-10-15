from django.contrib.auth import get_user_model
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from django.utils import timezone

from tenders.models import (
    Tender,
    TenderRound,
    Bid,
    TenderParticipant,
)

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
    ProjectActivity,
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
class ProjectActivityTests(TestCase):

    def test_project_activity_can_be_created(self):

        user = User.objects.create_user(
            username="activity_test_user",
            password="testpass123",
        )

        customer = Organization.objects.create(
            name="Activity Customer",
            organization_type="customer",
            owner=user,
        )

        project = Project.objects.create(
            title="Activity Test Project",
            description="Testing activity log",
            customer=customer,
            created_by=user,
            status="draft",
        )

        activity = ProjectActivity.objects.create(
            project=project,
            event_type="project.created",
            metadata={
                "source": "test"
            },
        )

        self.assertEqual(
            activity.project,
            project,
        )

        self.assertEqual(
            activity.event_type,
            "project.created",
        )

        self.assertEqual(
            activity.metadata["source"],
            "test",
        )

class ProjectActivityAPITests(TestCase):

    def setUp(self):

        self.client = APIClient()

        self.user = User.objects.create_user(
            username="activity_customer",
	    email="activity_customer@example.com",
            password="testpass123",
        )

        self.other_user = User.objects.create_user(
            username="activity_other",
	    email="other_activity@example.com",
            password="testpass123",
        )

        self.customer = Organization.objects.create(
            name="Activity Customer",
            organization_type="customer",
            status="active",
            owner=self.user,
        )

        self.customer_role = OrganizationRole.objects.create(
            name="activity_owner",
            organization_type="customer",
        )

        Membership.objects.create(
            user=self.user,
            organization=self.customer,
            role_fk=self.customer_role,
            status="active",
        )

        self.project = Project.objects.create(
            title="Activity Project",
            description="Activity Test",
            customer=self.customer,
            created_by=self.user,
            status="draft",
        )

        ProjectActivity.objects.create(
            project=self.project,
            actor=self.user,
            event_type="project.created",
            metadata={
                "source": "test"
            },
        )


    def test_customer_can_view_project_activity(self):

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.get(
            "/api/projects/{}/activity/".format(
                self.project.id
            )
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            len(response.data),
            1,
        )

        self.assertEqual(
            response.data[0]["event_type"],
            "project.created",
        )


    def test_other_user_cannot_view_project_activity(self):

        self.client.force_authenticate(
            user=self.other_user
        )

        response = self.client.get(
            "/api/projects/{}/activity/".format(
                self.project.id
            )
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            len(response.data),
            0,
        )

class ProjectTenderVisibilityTests(TestCase):

    def setUp(self):
        from django.utils import timezone
        from organizations.models import (
            Membership,
            Organization,
            OrganizationRole,
        )
        from projects.models import ProjectAssignment
        from tenders.models import Tender, TenderRound, Bid

        self.customer_user = User.objects.create_user(
            username="tender_visibility_customer",
            email="tender_visibility_customer@example.com",
            password="test-password",
        )

        self.consultant_user = User.objects.create_user(
            username="tender_visibility_consultant",
            email="tender_visibility_consultant@example.com",
            password="test-password",
        )

        customer_role, _ = OrganizationRole.objects.get_or_create(
            name="owner",
            organization_type="customer",
        )

        consultant_role, _ = OrganizationRole.objects.get_or_create(
            name="consultant",
            organization_type="company",
        )

        self.customer_org = Organization.objects.create(
            name="Tender Visibility Customer",
            organization_type="customer",
            status="active",
            owner=self.customer_user,
        )

        self.consultant_org = Organization.objects.create(
            name="Tender Visibility Consultant",
            organization_type="company",
            status="active",
            owner=self.consultant_user,
        )

        Membership.objects.create(
            user=self.customer_user,
            organization=self.customer_org,
            role_fk=customer_role,
            status="active",
        )

        consultant_membership = Membership.objects.create(
            user=self.consultant_user,
            organization=self.consultant_org,
            role_fk=consultant_role,
            status="active",
        )

        self.project = Project.objects.create(
            title="Tender Visibility Test Project",
            description="Project for tender visibility tests",
            customer=self.customer_org,
            created_by=self.customer_user,
            status="tender",
        )

        ProjectItem.objects.create(
            project=self.project,
            name="Tender Visibility Test Item",
            description="Item for tender visibility tests",
            quantity=1,
        )

        ProjectAssignment.objects.create(
            project=self.project,
            membership=consultant_membership,
            assigned_by=self.customer_user,
            status="active",
        )

        self.tender = Tender.objects.create(
            project=self.project,
            title="Tender Visibility Test",
            status="closed",
        )

        self.round = TenderRound.objects.create(
            tender=self.tender,
            round_number=1,
            status="evaluated",
            closed_at=timezone.now(),
        )

        from tenders.alias_generator import assign_bid_alias

        self.bids = []

        for index, amount in enumerate(
            [1000, 2000, 3000, 4000],
            start=1,
        ):
            workshop_owner = User.objects.create_user(
                username=f"visibility_workshop_owner_{index}",
                email=f"visibility_workshop_owner_{index}@example.com",
                password="test-password",
            )
            workshop = Organization.objects.create(
                name=f"Visibility Workshop {index}",
                organization_type="workshop",
                status="active",
                owner=workshop_owner,
            )

            bid = Bid.objects.create(
                tender_round=self.round,
                workshop=workshop,
                total_amount=amount,
                final_amount=amount,
                discount_percentage=0,
                discount_amount=0,
                production_days=index * 5,
                delivery_days=index * 2,
                warranty_months=12 + index,
                technical_notes="test bid",
                status="submitted",
            )

            assign_bid_alias(bid)
            self.bids.append(bid)

        self.url = f"/api/projects/{self.project.id}/tender/"

        self.customer_client = APIClient()
        self.customer_client.force_authenticate(
            user=self.customer_user,
        )

        self.consultant_client = APIClient()
        self.consultant_client.force_authenticate(
            user=self.consultant_user,
        )

    def assert_no_price_fields(self, value):
        sensitive_fields = {
            "total_amount",
            "discount_percentage",
            "discount_amount",
            "final_amount",
            "unit_price",
            "total_price",
        }

        if isinstance(value, dict):
            self.assertTrue(
                sensitive_fields.isdisjoint(value.keys()),
                msg=(
                    "Sensitive price fields found in response: "
                    f"{sensitive_fields.intersection(value.keys())}"
                ),
            )

            for nested_value in value.values():
                self.assert_no_price_fields(nested_value)

        elif isinstance(value, list):
            for nested_value in value:
                self.assert_no_price_fields(nested_value)

    def test_customer_cannot_see_bids_or_prices_before_reveal(self):
        self.tender.revealed_at = None
        self.tender.reveal_at = None
        self.tender.save(
            update_fields=["revealed_at", "reveal_at"],
        )

        response = self.customer_client.get(self.url)

        self.assertEqual(response.status_code, 200)

        data = response.json()

        self.assertIsNone(data["evaluation"])

        tender_data = data["tender"]
        self.assertIsNotNone(tender_data)

        nested_bids = [
            bid
            for round_data in tender_data["rounds"]
            for bid in round_data["bids"]
        ]

        self.assertEqual(len(nested_bids), len(self.bids))

        for bid in nested_bids:
            self.assertTrue(bid["public_alias"])
            self.assertNotIn("id", bid)
            self.assertNotIn("workshop", bid)
            self.assertNotIn("workshop_name", bid)

        self.assert_no_price_fields(data)
        self.assert_no_price_fields(data)

    def test_customer_sees_prices_after_preliminary_approval_without_workshop_identity(self):
        from django.utils import timezone

        self.tender.preliminary_approved_at = timezone.now()
        self.tender.revealed_at = None
        self.tender.commission_check_1 = False
        self.tender.commission_check_2 = False
        self.tender.rankings_published_at = None
        self.tender.save(update_fields=[
            "preliminary_approved_at",
            "revealed_at",
            "commission_check_1",
            "commission_check_2",
            "rankings_published_at",
        ])

        response = self.customer_client.get(self.url)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsNone(data["evaluation"])

        nested_bids = [
            bid
            for round_data in data["tender"]["rounds"]
            for bid in round_data["bids"]
        ]
        self.assertEqual(len(nested_bids), len(self.bids))

        for bid in nested_bids:
            self.assertIn("total_amount", bid)
            self.assertIn("final_amount", bid)
            self.assertIn("discount_amount", bid)
            self.assertTrue(bid["public_alias"])
            self.assertNotIn("workshop", bid)
            self.assertNotIn("workshop_name", bid)
            self.assertNotIn("workshop_id", bid)

    def test_customer_only_sees_top_three_workshop_identities_after_rankings_published(self):
        from django.utils import timezone

        now = timezone.now()
        self.tender.revealed_at = now
        self.tender.commission_check_1 = True
        self.tender.commission_check_2 = True
        self.tender.rankings_published_at = now
        self.tender.save(update_fields=[
            "revealed_at",
            "commission_check_1",
            "commission_check_2",
            "rankings_published_at",
        ])

        response = self.customer_client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(response.data["evaluation"])

        results = response.data["evaluation"]["results"]
        self.assertEqual(len(results), len(self.bids))

        for result in results:
            if result["rank"] <= 3:
                self.assertIsNotNone(result["workshop_name"])
                self.assertIsNotNone(result["workshop_id"])
            else:
                self.assertIsNone(result["workshop_name"])
                self.assertIsNone(result["workshop_id"])

        self.assertEqual(
            response.data["evaluation"]["summary"]["winner"],
            next(
                result["workshop_name"]
                for result in results
                if result["rank"] == 1
            ),
        )

    def test_customer_sees_all_bids_after_reveal(self):
        from django.utils import timezone

        now = timezone.now()
        self.tender.revealed_at = now
        self.tender.commission_check_1 = True
        self.tender.commission_check_2 = True
        self.tender.rankings_published_at = now
        self.tender.save(update_fields=[
            "revealed_at",
            "commission_check_1",
            "commission_check_2",
            "rankings_published_at",
        ])

        response = self.customer_client.get(self.url)

        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIsNotNone(data["evaluation"])

        results = data["evaluation"]["results"]
        self.assertEqual(len(results), len(self.bids))

        visible_bid_ids = {
            result["bid_id"]
            for result in results
            if result.get("bid_id") is not None
        }

        nested_bids = [
            bid
            for round_data in data["tender"]["rounds"]
            for bid in round_data["bids"]
        ]

        self.assertEqual(len(nested_bids), len(self.bids))

        expected_aliases = set(
            Bid.objects.filter(
                id__in=visible_bid_ids,
            ).values_list("public_alias", flat=True)
        )

        nested_aliases = {
            bid["public_alias"]
            for bid in nested_bids
        }

        self.assertEqual(nested_aliases, expected_aliases)

        for bid in nested_bids:
            self.assertNotIn("id", bid)
            self.assertNotIn("workshop", bid)

            self.assertIn("total_amount", bid)
            self.assertIn("final_amount", bid)
            self.assertIn("discount_amount", bid)

            if bid["rank"] in (1, 2, 3):
                self.assertTrue(bid["workshop_name"])
            else:
                self.assertIsNone(bid["workshop_name"])

    def test_authorized_consultant_can_see_all_bids_after_reveal(self):
        from django.utils import timezone

        self.tender.revealed_at = timezone.now()
        self.tender.save(update_fields=["revealed_at"])

        response = self.consultant_client.get(self.url)

        self.assertEqual(response.status_code, 200)

        data = response.json()

        self.assertIsNotNone(data["evaluation"])

        nested_bids = [
            bid
            for round_data in data["tender"]["rounds"]
            for bid in round_data["bids"]
        ]

        self.assertEqual(len(nested_bids), len(self.bids))

        returned_bid_ids = {
            bid["id"]
            for bid in nested_bids
        }

        expected_bid_ids = {
            bid.id
            for bid in self.bids
        }

        self.assertEqual(returned_bid_ids, expected_bid_ids)


    def test_authorized_consultant_sees_anonymous_bids_before_reveal(self):

        self.tender.revealed_at = None
        self.tender.reveal_at = None

        self.tender.save(
            update_fields=[
                "revealed_at",
                "reveal_at",
            ],
        )

        response = self.consultant_client.get(
            self.url
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        data = response.json()

        self.assertIsNone(
            data["evaluation"]
        )

        nested_bids = [
            bid
            for round_data in data["tender"]["rounds"]
            for bid in round_data["bids"]
        ]

        self.assertEqual(
            len(nested_bids),
            len(self.bids),
        )

        for bid in nested_bids:

            self.assertTrue(
                bid["public_alias"]
            )

            self.assertNotIn(
                "workshop",
                bid,
            )

            self.assertNotIn(
                "workshop_name",
                bid,
            )

        self.assert_no_price_fields(data)
class ProjectTenderVisibilityAPITests(TestCase):

    def setUp(self):

        self.client = APIClient()

        self.user = User.objects.create_user(
            username="tender_visibility_api_user",
            password="testpass123",
        )

        self.customer = Organization.objects.create(
            name="API Customer",
            organization_type="customer",
            status="active",
            owner=self.user,
        )

        role = OrganizationRole.objects.create(
            name="owner",
            organization_type="customer",
        )

        Membership.objects.create(
            user=self.user,
            organization=self.customer,
            role_fk=role,
            status="active",
        )

        self.client.force_authenticate(
            user=self.user
        )

        self.project = Project.objects.create(
            title="Visibility API Project",
            customer=self.customer,
            created_by=self.user,
            status="tender",
        )

        ProjectItem.objects.create(
            project=self.project,
            name="Visibility Test Item",
        )

        self.tender = Tender.objects.create(
            project=self.project,
            title="Visibility API Tender",
            status="open",
            reveal_at=timezone.now() + timezone.timedelta(hours=2),
        )

        self.round = TenderRound.objects.create(
            tender=self.tender,
            round_number=1,
            status="closed",
        )

        self.workshop = Organization.objects.create(
            name="Hidden Workshop",
            organization_type="workshop",
            owner=self.user,
        )

        self.bid = Bid.objects.create(
            tender_round=self.round,
            workshop=self.workshop,
            total_amount=5000000,
            status="submitted",
            public_alias="ALPHA-4A12",
        )


    def test_pre_reveal_tender_does_not_expose_price_in_api(self):

        response = self.client.get(
            "/api/projects/{}/tender/".format(
                self.project.id
            )
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        data = response.json()

        bids = (
            data["tender"]["rounds"][0]["bids"]
        )

        self.assertEqual(
            len(bids),
            1,
        )

        bid = bids[0]

        self.assertIn(
            "public_alias",
            bid,
        )

        self.assertNotIn(
            "total_amount",
            bid,
        )

        self.assertNotIn(
            "final_amount",
            bid,
        )

        self.assertEqual(
            bid["public_alias"],
            "ALPHA-4A12",
        )

        self.assertNotIn(
            "workshop",
            bid,
        )

        self.assertNotIn(
            "workshop_name",
            bid,
        )

        self.assertFalse(
            data["visibility"]["show_workshop_identity"]
        )

        self.assertFalse(
            data["visibility"]["show_price"]
        )

    def test_workshop_sees_only_its_own_bid_before_and_after_reveal(self):
        workshop_user = User.objects.create_user(
            username="visibility_workshop_user",
            email="visibility_workshop_user@example.com",
            password="testpass123",
        )

        workshop_role = OrganizationRole.objects.create(
            name="workshop_member_visibility_test",
            organization_type="workshop",
        )

        Membership.objects.create(
            user=workshop_user,
            organization=self.workshop,
            role_fk=workshop_role,
            status="active",
        )

        rival_workshop = Organization.objects.create(
            name="Rival Workshop",
            organization_type="workshop",
            owner=self.user,
        )

        TenderParticipant.objects.create(
            tender=self.tender,
            organization=self.workshop,
        )
        TenderParticipant.objects.create(
            tender=self.tender,
            organization=rival_workshop,
        )

        Bid.objects.create(
            tender_round=self.round,
            workshop=rival_workshop,
            total_amount=9000000,
            status="submitted",
            public_alias="BRAVO-9B21",
        )

        client = APIClient()
        client.force_authenticate(user=workshop_user)
        url = "/api/projects/{}/tender/".format(self.project.id)

        for reveal in (False, True):
            if reveal:
                self.tender.revealed_at = timezone.now()
                self.tender.save(update_fields=["revealed_at"])

            response = client.get(url)
            self.assertEqual(response.status_code, 200)

            data = response.json()
            bids = data["tender"]["rounds"][0]["bids"]

            self.assertEqual(len(bids), 1)
            self.assertEqual(bids[0]["workshop"], self.workshop.id)
