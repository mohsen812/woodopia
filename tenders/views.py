from rest_framework import generics
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from evaluation.services import evaluate_tender
from .models import (
    Tender,
    TenderParticipant,
    TenderRound,
    Bid,
)

from .serializers import (
    TenderSerializer,
    TenderParticipantSerializer,
    BidSerializer,
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

class TenderEvaluationView(
    generics.GenericAPIView
):

    queryset = Tender.objects.all()

    def get(self, request, pk):

        result = evaluate_tender(pk)

        return Response(result)