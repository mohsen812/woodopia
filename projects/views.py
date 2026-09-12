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
)

from .serializers import (
    ProjectFullSerializer,
    ProjectCreateSerializer,
    ProjectVisualSerializer,
    TenderSelectWinnerSerializer,
    ProjectAttachmentSerializer,
    ProjectAttachmentCreateSerializer,
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

        user = self.request.user

        return Project.objects.filter(
            customer__members__user=user,
            customer__members__status="active",
            customer__organization_type="customer",
            customer__status="active",
        ).distinct().order_by(
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

        return Project.objects.filter(
            customer__members__user=user,
            customer__members__status="active",
            customer__organization_type="customer",
            customer__status="active",
        ).distinct()

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

        user = self.request.user

        return Project.objects.filter(
            customer__members__user=user,
            customer__members__status="active",
            customer__organization_type="customer",
            customer__status="active",
        ).distinct()

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

    queryset = Project.objects.all()
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
    queryset = Project.objects.all()
    serializer_class = TenderSelectWinnerSerializer

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
