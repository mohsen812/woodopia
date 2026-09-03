from rest_framework import generics
from rest_framework.response import Response
from rest_framework.exceptions import NotFound

from tenders.models import Tender, Bid
from tenders.serializers import TenderSerializer

from evaluation.services import evaluate_tender

from .models import Project, ProjectVisual

from .serializers import (
    ProjectFullSerializer,
    ProjectCreateSerializer,
    ProjectVisualSerializer,
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

    serializer_class = ProjectFullSerializer


# =====================================
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
# PROJECT TENDER SELECT WINNER
# =====================================

class ProjectTenderSelectWinnerView(
    generics.GenericAPIView
):

    queryset = Project.objects.all()


    def post(self, request, pk):

        project = self.get_object()


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


        bid_id = request.data.get(
            "bid_id"
        )


        if not bid_id:
            return Response(
                {
                    "error": "bid_id is required"
                },
                status=400
            )


        try:

            bid = Bid.objects.get(
                id=bid_id,
                tender_round__tender=tender
            )

        except Bid.DoesNotExist:

            raise NotFound(
                "Bid does not belong to this tender."
            )


        tender.winner_bid = bid

        tender.status = "awarded"

        tender.save(
            update_fields=[
                "winner_bid",
                "status"
            ]
        )


        return Response(
            {
                "message": "Tender awarded successfully",
                "tender_id": tender.id,
                "winner_bid_id": bid.id,
                "winner_workshop": bid.workshop.name,
                "status": tender.status
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