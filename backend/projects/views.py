from django.db.models import Q

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

from tenders.models import Tender

from tenders.serializers import TenderSerializer
from tenders.services import select_tender_bid

from evaluation.services import evaluate_tender

from .models import (
    Project,
    ProjectVisual,
    ProjectAttachment,
    ProjectAssignment,
    ProjectItem,
)

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
)
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
                status="draft",
            )
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
            )
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

        return get_visible_projects(
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

        serializer.save(
            project=project,
            uploaded_by=self.request.user
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
            ).distinct(),
            id=project_id,
        )

    def get(self, request, pk):

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
            .filter(
                project=project
            )
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

        tender_data = TenderSerializer(
            tender
        ).data

        evaluation_data = evaluate_tender(
            tender.id
        )

        return Response({
            "project_id": project.id,
            "project_title": project.title,
            "project_item_id": project_item.id,
            "project_item_name": project_item.name,
            "tender": tender_data,
            "evaluation": evaluation_data,
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

            tender = Tender.objects.create(
                project=project,
                title=(
                    f"{project.title} - "
                    "مناقصه"
                ),
                description=project.description or "",
                status="draft",
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

