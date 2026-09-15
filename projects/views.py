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
)

from .services import send_project_to_consultant

from .serializers import (
    ProjectFullSerializer,
    ProjectCreateSerializer,
    ProjectVisualSerializer,
    TenderSelectWinnerSerializer,
    ProjectAttachmentSerializer,
    ProjectAttachmentCreateSerializer,
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

        return get_visible_projects(
            self.request.user
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


# PROJECT TENDER
# =====================================

class ProjectTenderView(
    generics.GenericAPIView
):

    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):

        return get_visible_projects(
            self.request.user
        )

    def get(self, request, pk):

        project = self.get_object()

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
            .first()
        )

        if not tender:
            raise NotFound(
                "No tender exists for this project."
            )

        tender_data = TenderSerializer(
            tender
        ).data

        evaluation_data = evaluate_tender(
            tender.id
        )

        return Response(
            {
                "project_id": project.id,
                "project_title": project.title,
                "project_item_id": project_item.id,
                "project_item_name": project_item.name,
                "tender": tender_data,
                "evaluation": evaluation_data,
            }
        )

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

        tender = Tender.objects.filter(
            project=project
        ).first()

        if not tender:
            raise NotFound(
                "No tender exists for this project."
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
            ProjectAssignment.objects
            .filter(
                membership__user=self.request.user,
                membership__status="active",
                status="active",
            )
            .values_list(
                "membership",
                flat=True
            )
            .first()
        )


        if not membership:
            return Project.objects.none()


        return get_consultant_projects(
            membership
        )
    
