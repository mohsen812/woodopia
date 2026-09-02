from rest_framework import generics
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from evaluation.services import evaluate_tender
from evaluation.reports import build_tender_report
from .visibility import tender_is_revealed
from .services import award_tender
from .models import (
    Tender,
    TenderParticipant,
    TenderRound,
    PaymentSchedule,
    Bid,
    BidItem,
    
)

from .serializers import (
    TenderSerializer,
    TenderParticipantSerializer,
    BidSerializer,
    TenderRoundCreateSerializer,
    BidItemSerializer,
    PaymentScheduleSerializer,
    TenderAwardCreateSerializer,
    TenderAwardSerializer,
)

class TenderListCreateView(
    generics.ListCreateAPIView
):

    queryset = (
        Tender.objects
        .all()
        .order_by("-created_at")
    )

    serializer_class = TenderSerializer


class TenderDetailView(
    generics.RetrieveAPIView
):

    queryset = Tender.objects.all()

    serializer_class = TenderSerializer


class TenderParticipantListCreateView(
    generics.ListCreateAPIView
):

    queryset = (
        TenderParticipant.objects
        .select_related(
            "tender",
            "organization"
        )
        .all()
        .order_by("-invited_at")
    )

    serializer_class = TenderParticipantSerializer

class TenderRoundListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = TenderRoundCreateSerializer

    def get_queryset(self):

        tender_id = self.kwargs["tender_id"]

        return (
            TenderRound.objects
            .filter(tender_id=tender_id)
            .order_by("round_number")
        )

    def perform_create(self, serializer):

        tender_id = self.kwargs["tender_id"]

        tender = Tender.objects.get(
            id=tender_id
        )

        serializer.save(
            tender=tender
        )
class BidCreateView(
    generics.CreateAPIView
):

    queryset = Bid.objects.all()

    serializer_class = BidSerializer


    def perform_create(self, serializer):

        tender_round = serializer.validated_data[
            "tender_round"
        ]

        workshop = serializer.validated_data[
            "workshop"
        ]


        tender = tender_round.tender


        participant_exists = TenderParticipant.objects.filter(
            tender=tender,
            organization=workshop
        ).exists()


        if not participant_exists:

            raise ValidationError(
                {
                    "workshop":
                    "This workshop is not a participant in this tender."
                }
            )


        existing_bid = Bid.objects.filter(
            tender_round=tender_round,
            workshop=workshop,
        ).exists()


        if existing_bid:

            raise ValidationError(
                {
                    "workshop":
                    "This workshop already submitted a bid for this round."
                }
            )


        serializer.save()
class BidDetailView(
    generics.RetrieveAPIView
):

    queryset = (
        Bid.objects
        .prefetch_related(
            "items",
            "payment_schedules",
        )
        .all()
    )

    serializer_class = BidSerializer
class BidItemCreateView(
    generics.CreateAPIView
):

    queryset = BidItem.objects.all()

    serializer_class = BidItemSerializer


    def perform_create(self, serializer):

        bid_id = self.kwargs["bid_id"]

        bid = Bid.objects.get(
            id=bid_id
        )

        serializer.save(
            bid=bid
        )
class TenderEvaluationView(
    generics.GenericAPIView
):

    queryset = Tender.objects.all()

    def get(self, request, pk):

        result = evaluate_tender(pk)

        return Response(result)
class TenderReportView(
    generics.GenericAPIView
):

    queryset = Tender.objects.all()

    def get(self, request, pk):

        tender = self.get_object()

        if not tender_is_revealed(tender):
            return Response(
                {
                    "status": "locked",
                    "message": "Tender results are not revealed yet."
                },
                status=403
            )

        report = build_tender_report(
            pk
        )

        return Response(report)
class PaymentScheduleListCreateView(generics.ListCreateAPIView):

    serializer_class = PaymentScheduleSerializer

    def get_queryset(self):

        bid_id = self.kwargs.get("bid_id")

        return PaymentSchedule.objects.filter(
            bid_id=bid_id
        )


    def perform_create(self, serializer):

        bid_id = self.kwargs.get("bid_id")

        bid = Bid.objects.get(
            id=bid_id
        )

        last_stage = bid.payment_schedules.order_by(
            "-stage_order"
        ).first()

        next_stage = 1

        if last_stage:
            next_stage = last_stage.stage_order + 1

        percentage = serializer.validated_data["percentage"]

        amount = (
            bid.total_amount * percentage / 100
        )

        serializer.save(
            bid=bid,
            stage_order=next_stage,
            amount=amount,
        )
class TenderBidListView(
    generics.ListAPIView
):

    serializer_class = BidSerializer

    def get_queryset(self):

        from .visibility import get_visible_bids

        tender_id = self.kwargs.get(
            "tender_id"
        )

        tender = Tender.objects.get(
            id=tender_id
        )

        viewer_type = self.request.query_params.get(
            "viewer_type"
        )

        return get_visible_bids(
            tender,
            viewer_type,
        )
class TenderAwardView(
    generics.GenericAPIView
):

    queryset = Tender.objects.all()

    serializer_class = TenderAwardCreateSerializer


    def post(self, request, pk):

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        bid_id = serializer.validated_data["bid_id"]


        try:

            award = award_tender(
                tender_id=pk,
                bid_id=bid_id,
                user=request.user,
            )

        except ValueError as e:

            return Response(
                {
                    "error": str(e)
                },
                status=400
            )


        return Response(
            TenderAwardSerializer(award).data,
            status=201
        )
