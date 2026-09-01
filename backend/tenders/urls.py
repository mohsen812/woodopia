from django.urls import path

from .views import (
    TenderListCreateView,
    TenderDetailView,
    TenderParticipantListCreateView,
    TenderRoundListCreateView,
    BidCreateView,
    BidDetailView,
    BidItemCreateView,
    PaymentScheduleListCreateView,
    TenderEvaluationView,
    TenderReportView,
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
        "<int:tender_id>/participants/",
        TenderParticipantListCreateView.as_view(),
        name="tender-participant-list-create"
    ),

    path(
        "<int:tender_id>/rounds/",
        TenderRoundListCreateView.as_view(),
        name="tender-round-list-create"
    ),

    path(
        "<int:pk>/evaluation/",
        TenderEvaluationView.as_view(),
        name="tender-evaluation"
    ),
    path(
        "<int:pk>/report/",
        TenderReportView.as_view(),
        name="tender-report"
    ),

    path(
        "<int:tender_id>/bids/",
        BidCreateView.as_view(),
        name="bid-create"
    ),
    path(
        "bids/<int:pk>/",
        BidDetailView.as_view(),
        name="bid-detail"
    ),

    path(
        "bids/<int:bid_id>/items/",
        BidItemCreateView.as_view(),
        name="bid-item-create"
    ),
    path(
        "bids/<int:bid_id>/payment-schedules/",
        PaymentScheduleListCreateView.as_view(),
        name="payment-schedule-list-create",
    ),

]