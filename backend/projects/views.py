from django.db.models import Q

from workspace.services import (
    get_active_membership,
    get_workspace_for_membership,
)

from .services import (
    get_consultant_projects,
    claim_project,
    get_consultant_dashboard_counts,
)
from rest_framework.permissions import IsAuthenticated

from rest_framework import generics
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from rest_framework import status
from django.shortcuts import get_object_or_404

from tenders.models import Tender, Bid, TenderParticipant

from tenders.serializers import (
    TenderSerializer,
    CustomerTenderSerializer,
    PreRevealTenderRoundSerializer,
)
from tenders.services import select_tender_bid

from evaluation.services import evaluate_tender

from .models import (
    Project,
    ProjectVisual,
    ProjectAttachment,
    ProjectAssignment,
    ProjectItem,
    ProjectActivity,
)

from tenders.models import SpecificationAttachment

from tenders.models import ConsultantSpecification

from .services import send_project_to_consultant

from .serializers import (
    ProjectFullSerializer,
    ProjectCreateSerializer,
    ProjectVisualSerializer,
    TenderSelectWinnerSerializer,
    ProjectAttachmentSerializer,
    ProjectAttachmentCreateSerializer,
    ConsultantStandardizationSerializer,
    ProjectActivitySerializer,
)

def get_project_file_access_queryset(user):
    """
    Include customer-visible projects, active consultant assignments,
    and projects with a tender participation for the active workshop user.
    """
    if user.is_superuser or user.is_staff:
        return get_visible_projects(user)

    visible_ids = get_visible_projects(user).values("pk")

    consultant_ids = ProjectAssignment.objects.filter(
        membership__user=user,
        membership__status="active",
        membership__role_fk__name="consultant",
        status="active",
    ).values_list("project_id", flat=True)

    workshop_project_ids = TenderParticipant.objects.filter(
        organization__organization_type="workshop",
        organization__members__user=user,
        organization__members__status="active",
    ).values_list("tender__project_id", flat=True)

    return Project.objects.filter(
        Q(pk__in=visible_ids)
        | Q(pk__in=consultant_ids)
        | Q(pk__in=workshop_project_ids)
    ).distinct()


def get_visible_projects(user):
    """
    Return projects visible to the current user.

    Staff/superuser:
        - projects created by the user
        - active customer projects

    Regular users:
        - projects belonging to active customer organizations
          where the user has an active membership.
    """

    if user.is_superuser or user.is_staff:

        return Project.objects.filter(
            Q(created_by=user)
            |
            Q(
                customer__organization_type="customer",
                customer__status="active",
            )
        ).distinct()

    return Project.objects.filter(
        customer__members__user=user,
        customer__members__status="active",
        customer__organization_type="customer",
        customer__status="active",
    ).distinct()
class ConsultantDashboardView(
    generics.GenericAPIView
):
    permission_classes = [
        IsAuthenticated
    ]

    def get(self, request):

        membership = (
            Membership.objects
            .filter(
                user=request.user,
                status="active",
                role_fk__name="consultant",
            )
            .first()
        )

        if not membership:
            return Response(
                {
                    "error": (
                        "User does not have "
                        "an active consultant membership."
                    )
                },
                status=403,
            )

        counts = get_consultant_dashboard_counts(
            membership
        )

        return Response(counts)
# =====================================
# CONSULTANT QUEUE
# =====================================

from organizations.models import Membership

from .services import (
    get_consultant_queue,
    claim_project,
)


class ConsultantQueueView(
    generics.ListAPIView
):
    permission_classes = [
        IsAuthenticated
    ]

    serializer_class = ProjectFullSerializer

    def get_queryset(self):

        membership = (
            Membership.objects
            .filter(
                user=self.request.user,
                status="active",
                role_fk__name="consultant",
            )
            .first()
        )

        if not membership:
            return Project.objects.none()

        return get_consultant_queue()


# =====================================
# CONSULTANT CLAIM
# =====================================

class ConsultantClaimView(
    generics.GenericAPIView
):
    permission_classes = [
        IsAuthenticated
    ]

    def post(self, request, pk):

        membership = (
            Membership.objects
            .filter(
                user=request.user,
                status="active",
                role_fk__name="consultant",
            )
            .first()
        )

        if not membership:
            return Response(
                {
                    "error": (
                        "User does not have "
                        "an active consultant membership."
                    )
                },
                status=403,
            )

        project = get_object_or_404(
            Project.objects.all(),
            id=pk,
        )

        try:

            assignment = claim_project(
                project=project,
                membership=membership,
            )

        except ValueError as exc:

            return Response(
                {
                    "error": str(exc)
                },
                status=400,
            )

        return Response(
            {
                "message": (
                    "Project claimed successfully."
                ),
                "project_id": project.id,
                "project_title": project.title,
                "assignment_id": assignment.id,
                "consultant": (
                    membership.user.username
                ),
            },
            status=200,
        )
# =====================================
# PROJECT LIST + CREATE
# =====================================
class ProjectListCreateView(
    generics.ListCreateAPIView
):

    queryset = Project.objects.all().order_by(
        "-created_at"
    )

    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):

        return get_visible_projects(
            self.request.user
        ).order_by(
            "-created_at"
        )

    def get_serializer_class(self):

        if self.request.method == "POST":

            return ProjectCreateSerializer

        return ProjectFullSerializer

# =====================================
# PROJECT DETAIL
# =====================================
class ProjectDetailView(
    generics.RetrieveAPIView
):

    queryset = Project.objects.all()

    permission_classes = [
        IsAuthenticated
    ]

    serializer_class = ProjectFullSerializer

    def get_queryset(self):

        user = self.request.user

        # Staff / Superuser:
        # keep existing project visibility rules.
        if user.is_superuser or user.is_staff:
            return get_visible_projects(user)

        # Consultant:
        # only projects assigned to the consultant
        # through an active ProjectAssignment.
        consultant_projects = ProjectAssignment.objects.filter(
            membership__user=user,
            membership__status="active",
            membership__role_fk__name="consultant",
            status="active",
        ).values_list(
            "project_id",
            flat=True,
        )

        if consultant_projects.exists():
            return Project.objects.filter(
                id__in=consultant_projects
            )

        # Customer / other regular users:
        # keep existing visibility rules.
        return get_visible_projects(user)

class ProjectActivityListView(
    generics.ListAPIView
):

    serializer_class = ProjectActivitySerializer

    permission_classes = [
        IsAuthenticated
    ]


    def get_queryset(self):

        user = self.request.user

        project_id = self.kwargs["pk"]

        visible_project = get_visible_projects(
            user
        ).filter(
            id=project_id
        ).first()

        if not visible_project:
            return ProjectActivity.objects.none()

        return (
            ProjectActivity.objects
            .filter(
                project=visible_project
            )
            .select_related(
                "actor"
            )
        )
# =====================================
# CONSULTANT STANDARDIZATION
# =====================================

class ConsultantStandardizationView(
    generics.GenericAPIView
):

    permission_classes = [
        IsAuthenticated
    ]

    serializer_class = (
        ConsultantStandardizationSerializer
    )

    def get_project(self):

        project_id = self.kwargs["pk"]

        user = self.request.user

        if user.is_superuser or user.is_staff:

            return get_object_or_404(
                Project.objects.all(),
                id=project_id,
            )


        return get_object_or_404(
            Project.objects.filter(
                Q(
                    assignments__membership__user=user,
                    assignments__membership__status="active",
                    assignments__membership__role_fk__name="consultant",
                    assignments__status="active",
                )
                |
                Q(
                    customer__members__user=user,
                    customer__members__status="active",
                )
				                |
                Q(
                    tenders__participants__organization__members__user=user,
                    tenders__participants__organization__members__status="active",
                    tenders__participants__organization__organization_type="workshop",
                )
            ).distinct(),
            id=project_id,
        )

    def get_or_create_draft_tender(
        self,
        project
    ):

        tender = (
            Tender.objects
            .filter(
                project=project,
				specifications__isnull=False,
            )
			.distinct()
            .order_by("-created_at")
            .first()
        )

        if tender:
            return tender

        return Tender.objects.create(
            project=project,
            title=(
                f"{project.title} - "
                "استانداردسازی"
            ),
            description=project.description or "",
            status="draft",
        )

    def get(self, request, pk):

        project = self.get_project()

        tender = self.get_or_create_draft_tender(
            project
        )

        specifications = (
            tender.specifications
            .select_related(
                "project_item"
            )
        .prefetch_related(
            "attachments"
            )
        .order_by(
            "row_number"
            )
        )
        data = []

        for specification in specifications:

            item = specification.project_item

            data.append({
                "project_item_id": item.id,
                "specification_id": specification.id,
                
                "customer_review_status": (
                    specification.customer_review_status
                ),
                
                "name": item.name,
                "description": item.description,
                "quantity": item.quantity,
                "title": specification.title,
                "dimensions": specification.dimensions,
                "material": specification.material,
                "technical_details": (
                    specification.technical_details
                ),
                "is_required": (
                    specification.is_required
                ),
            })

        return Response({
            "project_id": project.id,
            "tender_id": tender.id,
            "tender_status": tender.status,
            
            "standardization_status":
                tender.standardization_status,
            
            "items": data,
        })

    def post(self, request, pk):

        project = self.get_project()

        serializer = (
            self.get_serializer(
                data=request.data
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        data = serializer.validated_data

        tender = self.get_or_create_draft_tender(
            project
        )

        project_item_id = data.get(
            "project_item_id"
        )

        if project_item_id:

            item = get_object_or_404(
                ProjectItem,
                id=project_item_id,
                project=project,
            )

        else:

            item = ProjectItem.objects.create(
                project=project,
                name=data["name"],
                description=data.get(
                    "description",
                    ""
                ),
                quantity=data.get(
                    "quantity",
                    1
                ),
            )

        specification = (
            item.consultant_specifications
            .filter(
                tender=tender
            )
            .first()
        )

        if specification:

            specification.title = data["title"]
            specification.dimensions = data.get(
                "dimensions",
                ""
            )
            specification.material = data.get(
                "material",
                ""
            )
            specification.description = data.get(
                "description",
                ""
            )
            specification.quantity = data.get(
                "quantity",
                1
            )
            specification.technical_details = (
                data.get(
                    "technical_details",
                    ""
                )
            )
            specification.is_required = data.get(
                "is_required",
                True
            )

            specification.save()

        else:

            last_specification = (
                tender.specifications
                .order_by("-row_number")
                .first()
            )

            next_row = 1

            if last_specification:
                next_row = (
                    last_specification.row_number
                    + 1
                )

            from tenders.models import (
                ConsultantSpecification
            )

            specification = (
                ConsultantSpecification.objects.create(
                    tender=tender,
                    project_item=item,
                    row_number=next_row,
                    title=data["title"],
                    dimensions=data.get(
                        "dimensions",
                        ""
                    ),
                    material=data.get(
                        "material",
                        ""
                    ),
                    description=data.get(
                        "description",
                        ""
                    ),
                    quantity=data.get(
                        "quantity",
                        1
                    ),
                    technical_details=data.get(
                        "technical_details",
                        ""
                    ),
                    is_required=data.get(
                        "is_required",
                        True
                    ),
                )
            )

        return Response(
            {
                "message": (
                    "Standardization saved successfully."
                ),
                "project_id": project.id,
                "tender_id": tender.id,
                "project_item_id": item.id,
                "specification_id": (
                    specification.id
                ),
            },
            status=status.HTTP_201_CREATED,
        )

class SendStandardizationToCustomerView(
    generics.GenericAPIView
):

    permission_classes = [
        IsAuthenticated
    ]


    def post(self, request, pk):

        project = get_object_or_404(
            Project,
            id=pk
        )


        tender = (
            Tender.objects
            .filter(
                project=project
            )
            .order_by("-created_at")
            .first()
        )


        if not tender:

            return Response(
                {
                    "error":
                    "Tender not found"
                },
                status=404
            )


        specifications = (
            ConsultantSpecification.objects
            .filter(
                tender=tender
            )
        )


        for specification in specifications:

            if (
                specification.customer_review_status
                == "revise"
            ):

                specification.customer_review_status = (
                    "pending"
                )

                specification.customer_review_note = ""

                specification.save()


        tender.standardization_status = (
            "pending_customer"
        )


        tender.save()


        return Response(
            {
                "message":
                "Standardization sent to customer",

                "project_id":
                project.id,

                "tender_id":
                tender.id,

                "status":
                tender.standardization_status,
            }
        )
    
# =====================================
# CUSTOMER STANDARDIZATION VIEW
# =====================================

class CustomerStandardizationView(
    generics.GenericAPIView
):

    permission_classes = [
        IsAuthenticated
    ]

    def get_project(self):

        project_id = self.kwargs["pk"]

        user = self.request.user

        if user.is_superuser or user.is_staff:

            return get_object_or_404(
                Project.objects.all(),
                id=project_id,
            )

        return get_object_or_404(
            Project.objects.filter(
                customer__members__user=user,
                customer__members__status="active",
                customer__organization_type="customer",
                customer__status="active",
            ).distinct(),
            id=project_id,
        )


    def get_or_create_draft_tender(
        self,
        project
    ):

        tender = (
            Tender.objects
            .filter(
                project=project,
				specifications__isnull=False,
            )
			.distinct()
            .order_by("-created_at")
            .first()
        )

        if tender:
            return tender

        return Tender.objects.create(
            project=project,
            title=(
                f"{project.title} - "
                "استانداردسازی"
            ),
            description=project.description or "",
            status="draft",
        )


    def get(self, request, pk):

        project = self.get_project()

        tender = self.get_or_create_draft_tender(
            project
        )

        specifications = (
            tender.specifications
            .select_related(
                "project_item"
            )
            .order_by(
                "row_number"
            )
        )

        items = []

        for specification in specifications:

            item = specification.project_item

            items.append({

                "id":
                    specification.id,

                "row_number":
                    specification.row_number,

                "name":
                    item.name,

                "title":
                    specification.title,
                
                "customer_review_status":
                    specification.customer_review_status,
                
                "dimensions":
                    specification.dimensions,

                "material":
                    specification.material,

                "quantity":
                    specification.quantity,

                "technical_details":
                    specification.technical_details,

                "customer_review_status":
                    specification.customer_review_status,

                "files": [
                    {
                        "id": attachment.id,
                        "file": attachment.file.url,
                        "title": attachment.title or "",
                    }
                    for attachment
                    in specification.attachments.all()
                ],

        })

        return Response({

            "project_id":
                project.id,

            "project_title":
                project.title,

            "tender_id":
                tender.id,

            "tender_status":
                tender.status,
            
            "standardization_status":
                tender.standardization_status,

            "items":
                items,

        })
class CustomerSpecificationReviewView(
    generics.GenericAPIView
):

    permission_classes = [
        IsAuthenticated
    ]


    def post(self, request, pk):

        specification = get_object_or_404(
            ConsultantSpecification,
            id=pk
        )
        
        status_value = request.data.get(
            "status"
        )


        if status_value not in [
            "approved",
            "revise",
        ]:
            return Response(
                {
                    "error":
                    "Invalid status"
                },
                status=400
            )


        specification.customer_review_status = (
            status_value
        )


        specification.customer_review_note = (
            request.data.get(
                "note",
                ""
            )
        )


        specification.save()


        return Response(
            {
                "id":
                    specification.id,

                "status":
                    specification.customer_review_status
            }
        )

class CustomerStandardizationReviewView(
    generics.GenericAPIView
):

    permission_classes = [
        IsAuthenticated
    ]


    def post(self, request, pk):

        project = get_object_or_404(
            Project,
            id=pk
        )

        tender = (
            Tender.objects
            .filter(
                project=project
            )
            .order_by("-created_at")
            .first()
        )


        if not tender:
            return Response(
                {
                    "error":
                    "Tender not found"
                },
                status=404
            )


        status_value = request.data.get(
            "status"
        )


        if status_value not in [
            "approved",
            "revision_requested",
        ]:
            return Response(
                {
                    "error":
                    "Invalid status"
                },
                status=400
            )


        tender.standardization_status = (
            status_value
        )

        tender.save()


        return Response(
            {
                "project_id":
                    project.id,

                "tender_id":
                    tender.id,

                "standardization_status":
                    tender.standardization_status,
            }
        )

class CustomerStandardizationGlobalReviewView(
    generics.GenericAPIView
):

    permission_classes = [
        IsAuthenticated
    ]


    def post(self, request, pk):

        project = get_object_or_404(
            Project,
            id=pk
        )


        tender = (
            Tender.objects
            .filter(
                project=project
            )
            .order_by("-created_at")
            .first()
        )


        if not tender:
            return Response(
                {
                    "error":
                    "Tender not found"
                },
                status=404
            )


        status_value = request.data.get(
            "status"
        )


        if status_value not in [
            "approved",
            "revision_requested",
        ]:
            return Response(
                {
                    "error":
                    "Invalid status"
                },
                status=400
            )


        tender.standardization_status = (
            status_value
        )

        tender.save()


        return Response(
            {
                "project_id":
                    project.id,

                "tender_id":
                    tender.id,

                "standardization_status":
                    tender.standardization_status,
            }
        )   

# =====================================
# PROJECT ATTACHMENTS
# =====================================

class ProjectAttachmentListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = ProjectAttachmentSerializer

    permission_classes = [
        IsAuthenticated
    ]


    def get_project_queryset(self):

        return get_project_file_access_queryset(
            self.request.user
        )


    def get_project(self):

        return get_object_or_404(
            self.get_project_queryset(),
            id=self.kwargs["pk"]
        )


    def get_queryset(self):

        project = self.get_project()

        return ProjectAttachment.objects.filter(
            project=project
        ).order_by("-created_at")


    def perform_create(self, serializer):

        project = self.get_project()
        user = self.request.user

        # FEEMAAS internal users
        if user.is_superuser or user.is_staff:
            owner_role = "company"

        else:
            # A workshop may access the project through its tender
            # participation without having a ProjectAssignment.
            workshop_access = TenderParticipant.objects.filter(
                tender__project=project,
                organization__organization_type="workshop",
                organization__members__user=user,
                organization__members__status="active",
            ).exists()

            if workshop_access:
                owner_role = "workshop"

            else:
                assignment = (
                    project.assignments
                    .filter(
                        membership__user=user,
                        membership__status="active",
                        status="active",
                    )
                    .select_related(
                        "membership__role_fk",
                        "membership__organization",
                    )
                    .first()
                )

                if assignment:
                    role_name = (
                        assignment.membership.role_fk.name
                        if assignment.membership.role_fk
                        else ""
                    )

                    role_map = {
                        "customer": "customer",
                        "consultant": "consultant",
                        "workshop": "workshop",
                        "designer": "designer",
                        "company": "company",
                    }

                    owner_role = role_map.get(
                        role_name,
                        "customer",
                    )

                else:
                    # Project customer without a project assignment.
                    owner_role = "customer"

        serializer.save(
            project=project,
            uploaded_by=user,
            owner_role=owner_role,
        )


class ProjectFileCenterView(
    generics.ListAPIView
):

    serializer_class = ProjectAttachmentSerializer

    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):

        project = get_object_or_404(
            get_project_file_access_queryset(
                self.request.user
            ),
            id=self.kwargs["pk"]
        )

        return ProjectAttachment.objects.filter(
            project=project
        ).select_related(
            "uploaded_by"
        ).order_by(
            "-created_at"
        )

    def list(
        self,
        request,
        *args,
        **kwargs
    ):

        project = get_object_or_404(
            get_project_file_access_queryset(
                request.user
            ),
            id=kwargs["pk"]
        )

        queryset = self.get_queryset()

        data = {
            "customer": [],
            "consultant": [],
            "workshop": [],
            "designer": [],
            "company": [],
        }

        # -----------------------------------------
        # PROJECT ATTACHMENTS
        # -----------------------------------------

        serializer = self.get_serializer(
            queryset,
            many=True
        )

        for item, obj in zip(
            serializer.data,
            queryset
        ):

            role = obj.owner_role

            if role in data:

                item["source"] = "project"

                data[role].append(
                    item
                )

        # -----------------------------------------
        # CONSULTANT STANDARDIZATION FILES
        # -----------------------------------------

        specification_attachments = (
            SpecificationAttachment.objects
            .filter(
                specification__tender__project=project
            )
            .select_related(
                "uploaded_by",
                "specification",
            )
            .order_by(
                "-created_at"
            )
        )

        for attachment in specification_attachments:

            data["consultant"].append({

                "id":
                    attachment.id,

                "file":
                    attachment.file.url
                    if attachment.file
                    else "",

                "file_type":
                    "document",

                "title":
                    attachment.title or "",

                "description":
                    "",

                "version":
                    1,

                "created_at":
                    attachment.created_at,

                "uploaded_by":
                    attachment.uploaded_by_id,

                "owner_role":
                    "consultant",

                "source":
                    "standardization",

                "specification_title":
                    attachment.specification.title
                    if attachment.specification
                    else "",

            })

        # -----------------------------------------
        # RETURN ROLE-BASED FILE CENTER
        # -----------------------------------------

        return Response(
            data
        )
# =====================================
# PROJECT ATTACHMENT DELETE
# =====================================

class ProjectAttachmentDeleteView(
    generics.DestroyAPIView
):

    serializer_class = ProjectAttachmentSerializer

    permission_classes = [
        IsAuthenticated
    ]


    def get_queryset(self):

        return ProjectAttachment.objects.filter(
            uploaded_by=self.request.user
        )
class WorkshopProjectAttachmentDeleteView(generics.DestroyAPIView):
    serializer_class = ProjectAttachmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project_id = self.kwargs["project_id"]
        user = self.request.user

        project = get_object_or_404(
            get_project_file_access_queryset(user),
            id=project_id,
        )

        is_workshop_participant = TenderParticipant.objects.filter(
            tender__project=project,
            organization__organization_type="workshop",
            organization__members__user=user,
            organization__members__status="active",
        ).exists()

        if not is_workshop_participant:
            return ProjectAttachment.objects.none()

        return ProjectAttachment.objects.filter(
            project=project,
            uploaded_by=user,
            owner_role="workshop",
        )
# =====================================
# PROJECT TENDER
# =====================================

class ProjectTenderView(
    generics.GenericAPIView
):

    permission_classes = [
        IsAuthenticated
    ]

    def get_project(self):

        project_id = self.kwargs["pk"]

        user = self.request.user

        if user.is_superuser or user.is_staff:

            return get_object_or_404(
                Project.objects.all(),
                id=project_id,
            )

        return get_object_or_404(
            Project.objects.filter(
                Q(
                    assignments__membership__user=user,
                    assignments__membership__status="active",
                    assignments__membership__role_fk__name="consultant",
                    assignments__status="active",
                )
                |
                Q(
                    customer__members__user=user,
                    customer__members__status="active",
                    customer__organization_type="customer",
                    customer__status="active",
                )
                |
                Q(
                    tenders__participants__organization__members__user=user,
                    tenders__participants__organization__members__status="active",
                    tenders__participants__organization__organization_type="workshop",
                )
            ).distinct(),
            id=project_id,
        )

    def get(self, request, pk):

        from tenders.authorization import (
            is_manager,
            has_customer_tender_access,
            has_consultant_tender_access,
            has_workshop_tender_access,
        )
        from tenders.visibility import (
            tender_is_revealed,
            get_tender_visibility,
        )

        project = self.get_project()

        project_item = (
            project.items
            .order_by("id")
            .first()
        )

        if not project_item:
            raise NotFound(
                "No project item exists for this project."
            )

        tender = (
            Tender.objects
            .filter(project=project)
            .order_by("-created_at")
            .first()
        )

        if not tender:
            return Response({
                "project_id": project.id,
                "project_title": project.title,
                "tender": None,
                "evaluation": None,
                "ready": False,
                "message": (
                    "هنوز مناقصه‌ای برای این پروژه ایجاد نشده است."
                ),
            })

        manager_view = is_manager(request.user)

        active_membership = get_active_membership(request)
        active_workspace = None

        if active_membership:
            active_workspace = get_workspace_for_membership(
                active_membership
            )["workspace"]

        customer_access = has_customer_tender_access(
            request.user,
            tender,
        )
        consultant_access = has_consultant_tender_access(
            request.user,
            tender,
        )
        workshop_access = has_workshop_tender_access(
            request.user,
            tender,
        )

        customer_view = False
        consultant_view = False
        workshop_view = False

        if manager_view:
            customer_view = has_customer_tender_access(
                request.user,
                tender,
            )
            consultant_view = has_consultant_tender_access(
                request.user,
                tender,
            )
            workshop_view = has_workshop_tender_access(
                request.user,
                tender,
            )
        elif active_membership:
            if active_workspace == "customer":
                customer_view = (
                    customer_access
                    and active_membership.organization_id
                    == tender.project.customer_id
                )

            elif active_workspace == "consultant":
                consultant_view = (
                    consultant_access
                    and ProjectAssignment.objects.filter(
                        project=project,
                        membership=active_membership,
                        status="active",
                    ).exists()
                )

            elif active_workspace == "workshop":
                workshop_view = (
                    workshop_access
                    and tender.participants.filter(
                        organization=active_membership.organization,
                    ).exists()
                )

            if not (
                customer_view
                or consultant_view
                or workshop_view
            ):
                return Response(
                    {
                        "detail": (
                            "فضای کاری فعال به این مناقصه "
                            "دسترسی ندارد."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

        else:
            available_views = []

            if customer_access:
                available_views.append("customer")

            if consultant_access:
                available_views.append("consultant")

            if workshop_access:
                available_views.append("workshop")

            if len(available_views) > 1:
                return Response(
                    {
                        "detail": (
                            "ابتدا فضای کاری فعال خود را انتخاب کنید."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            if not available_views:
                return Response(
                    {"detail": "دسترسی به این مناقصه مجاز نیست."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            customer_view = available_views[0] == "customer"
            consultant_view = available_views[0] == "consultant"
            workshop_view = available_views[0] == "workshop"

        revealed = tender_is_revealed(tender)

        if consultant_view:
            viewer_type = "consultant"
        elif workshop_view:
            viewer_type = "workshop"
        else:
            viewer_type = "customer"

        visibility = get_tender_visibility(
            tender,
            viewer_type,
        )
        if workshop_view:
            visibility["show_price"] = True
        if customer_view:
            from tenders.serializers import (
                AnonymousBidSerializer,
                CustomerPriceBidSerializer,
                CustomerRankedBidSerializer,
            )

            tender_data = CustomerTenderSerializer(tender).data
            customer_evaluation = (
                evaluate_tender(tender.id)
                if visibility.get("show_rank")
                else None
            )
            evaluation_by_bid_id = {
                result["bid_id"]: result
                for result in (customer_evaluation or {}).get("results", [])
                if result.get("bid_id") is not None
            }

            for round_data in tender_data.get("rounds", []):
                round_obj = tender.rounds.get(id=round_data["id"])
                visible_bids = round_obj.bids.filter(
                    status="submitted",
                ).exclude(
                    review_status="rejected",
                ).order_by("id")

                if (
                    visibility.get("show_rank")
                    and customer_evaluation
                    and customer_evaluation.get("round_id") == round_obj.id
                ):
                    bid_serializer = CustomerRankedBidSerializer(
                        visible_bids,
                        many=True,
                        context={
                            "evaluation_by_bid_id": evaluation_by_bid_id,
                        },
                    )
                elif visibility.get("show_price"):
                    bid_serializer = CustomerPriceBidSerializer(
                        visible_bids,
                        many=True,
                    )
                else:
                    bid_serializer = AnonymousBidSerializer(
                        visible_bids,
                        many=True,
                    )

                serialized_bids = list(bid_serializer.data)

                # Use the actual rank only after official ranking publication.
                if isinstance(getattr(bid_serializer, 'child', bid_serializer), CustomerRankedBidSerializer):
                    serialized_bids.sort(
                        key=lambda bid: (
                            bid.get("rank") is None,
                            bid.get("rank")
                            if bid.get("rank") is not None
                            else 10**9,
                        )
                    )

                round_data["bids"] = serialized_bids

        elif workshop_view:
            # A workshop must never receive competitors' bids.
            tender_data = TenderSerializer(tender).data

            if (
                active_membership
                and active_workspace == "workshop"
            ):
                workshop_ids = {
                    active_membership.organization_id
                }
            else:
                workshop_ids = set(
                    Membership.objects.filter(
                        user=request.user,
                        status="active",
                        organization__organization_type="workshop",
                        organization__tender_participations__tender=tender,
                    ).values_list(
                        "organization_id",
                        flat=True,
                    ).distinct()
                )

                if len(workshop_ids) != 1:
                    return Response(
                        {
                            "detail": (
                                "برای مشاهده پیشنهاد، "
                                "یک فضای کاری کارگاه مشخص انتخاب کنید."
                            )
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )

            for round_obj in tender_data.get("rounds", []):
                round_obj["bids"] = [
                    bid
                    for bid in round_obj.get("bids", [])
                    if bid.get("workshop") in workshop_ids
                ]

        elif consultant_view and not revealed:
            tender_data = TenderSerializer(tender).data

            for round_obj in tender_data.get("rounds", []):
                round_obj["bids"] = PreRevealTenderRoundSerializer(
                    tender.rounds.get(id=round_obj["id"])
                ).data["bids"]

        else:
            tender_data = TenderSerializer(tender).data

        # Commission workflow state is visible only to consultants.
        if consultant_view:
            tender_data.update({
                "preliminary_approved_at": tender.preliminary_approved_at,
                "commission_check_1": tender.commission_check_1,
                "commission_check_2": tender.commission_check_2,
                "rankings_published_at": tender.rankings_published_at,
            })

        # Customer selection is separate from the official tender award.
        from tenders.models import CustomerTenderSelection

        selection = (
            CustomerTenderSelection.objects
            .filter(tender=tender)
            .select_related("bid", "bid__workshop")
            .first()
        )

        selection_data = None
        if selection:
            selected_bid = selection.bid

            if consultant_view:
                selection_data = {
                    "bid_id": selected_bid.id,
                    "public_alias": selected_bid.public_alias,
                    "status": selection.status,
                    "selected_at": selection.selected_at.isoformat(),
                    "is_locked": selection.is_locked,
                    "workshop_name": (
                        selected_bid.workshop.name
                        if selected_bid.workshop
                        else None
                    ),
                    "workshop_id": selected_bid.workshop_id,
                }

            elif customer_view:
                selection_data = {
                    "bid_id": selected_bid.id,
                    "public_alias": selected_bid.public_alias,
                    "status": selection.status,
                    "selected_at": selection.selected_at.isoformat(),
                    "is_locked": selection.is_locked,
                }

            elif workshop_view:
                is_selected_for_this_workshop = (
                    bool(active_membership)
                    and active_workspace == "workshop"
                    and selected_bid.workshop_id
                    == active_membership.organization_id
                )

                selection_data = {
                    "is_selected_for_this_workshop":
                        is_selected_for_this_workshop,
                }

                if is_selected_for_this_workshop:
                    selection_data.update({
                        "bid_id": selected_bid.id,
                        "public_alias": selected_bid.public_alias,
                        "status": selection.status,
                        "selected_at": selection.selected_at.isoformat(),
                        "is_locked": selection.is_locked,
                    })

        tender_data["customer_selection"] = selection_data

        if not revealed:

            evaluation_data = None

        elif consultant_view:

            evaluation_data = evaluate_tender(
                tender.id
            )

        elif customer_view:

            if visibility.get("show_rank"):

                evaluation_data = evaluate_tender(
                    tender.id
                )

                if evaluation_data:
                    for result in evaluation_data.get("results", []):
                        if result.get("rank", 0) > 3:
                            result["workshop_name"] = None
                            result["workshop_id"] = None

                    results = evaluation_data.get("results", [])
                    winner = next(
                        (
                            result
                            for result in results
                            if result.get("rank") == 1
                        ),
                        None,
                    )

                    if "summary" in evaluation_data:
                        evaluation_data["summary"]["winner"] = (
                            winner.get("workshop_name")
                            if winner
                            else None
                        )

            else:

                evaluation_data = None

        else:

            evaluation_data = None


        return Response({
            "project_id": project.id,
            "project_title": project.title,
            "project_item_id": project_item.id,
            "project_item_name": project_item.name,
            "tender": tender_data,
            "evaluation": evaluation_data,
            "visibility": visibility,
            "ready": True,
        })
# =====================================
# PROJECT VISUAL LIST + CREATE
# =====================================

class ProjectVisualListCreateView(
    generics.ListCreateAPIView
):

    queryset = ProjectVisual.objects.all()

    serializer_class = ProjectVisualSerializer


# =====================================
# PROJECT VISUAL DETAIL
# =====================================

class ProjectVisualDetailView(
    generics.RetrieveUpdateDestroyAPIView
):

    queryset = ProjectVisual.objects.all()

    serializer_class = ProjectVisualSerializer
# =====================================
# PROJECT TENDER SELECT WINNER
# =====================================
class ProjectTenderSelectWinnerView(
    generics.GenericAPIView
):
    permission_classes = [
        IsAuthenticated
    ]

    serializer_class = TenderSelectWinnerSerializer

    def get_queryset(self):

        return get_visible_projects(
            self.request.user
        )

    def post(self, request, pk):
        project = self.get_object()

        tender = (
            Tender.objects
            .filter(
                project=project
            )
            .order_by("-created_at")
            .first()
        )


        if not tender:
            return Response(
                {"error": "No tender exists for this project."},
                status=404,
            )

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        bid_id = serializer.validated_data[
            "bid_id"
        ]

        try:
            selection = select_tender_bid(
                tender_id=tender.id,
                bid_id=bid_id,
                user=request.user,
            )

        except ValueError as exc:
            return Response(
                {
                    "error": str(exc)
                },
                status=400,
            )

        return Response(
            {
                "message": (
                    "Tender bid selected successfully."
                ),
                "project_id": project.id,
                "tender_id": tender.id,
                "selection_id": selection.id,
                "selected_bid_id": selection.bid_id,
                "selected_workshop": (
                    selection.bid.workshop.name
                    if selection.bid.workshop
                    else None
                ),
                "status": selection.status,
            },
            status=200,
        )

        # =====================================
# SEND PROJECT TO CONSULTANT
# =====================================

class SendProjectToConsultantView(
    generics.GenericAPIView
):

    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):

        return get_visible_projects(
            self.request.user
        )

    def post(self, request, pk):

        project = get_object_or_404(
            self.get_queryset(),
            id=pk
        )

        try:

            send_project_to_consultant(
                project
            )

        except ValueError as exc:

            return Response(
                {
                    "error": str(exc)
                },
                status=400,
            )


        return Response(
            {
                "message":
                    "Project sent to consultant queue.",
                "project_id":
                    project.id,
                "status":
                    project.status,
            }
        )

# =====================================
# CONSULTANT MY PROJECTS
# =====================================

class ConsultantMyProjectsView(
    generics.ListAPIView
):

    permission_classes = [
        IsAuthenticated
    ]

    serializer_class = ProjectFullSerializer


    def get_queryset(self):

        membership = (
            Membership.objects
            .filter(
                user=self.request.user,
                status="active",
                role_fk__name="consultant",
            )
            .first()
        )


        if not membership:
            return Project.objects.none()


        return get_consultant_projects(
            membership
        )

