from django.urls import path

from .views import (
    TenderListCreateView,
    TenderDetailView,
    BidCreateView,
)


urlpatterns = [

    path(
        "",
        TenderListCreateView.as_view(),
        name="tender-list-create"
    ),


    path(
        "<int:pk>/",
        TenderDetailView.as_view(),
        name="tender-detail"
    ),


    path(
        "<int:tender_id>/bids/",
        BidCreateView.as_view(),
        name="bid-create"
    ),

]