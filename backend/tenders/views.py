from rest_framework import generics

from .models import Tender, Bid

from .serializers import (
    TenderSerializer,
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



class BidCreateView(
    generics.CreateAPIView
):

    queryset = Bid.objects.all()

    serializer_class = BidSerializer