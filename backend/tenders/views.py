from rest_framework import generics

from .models import (
    Tender,
    TenderParticipant,
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