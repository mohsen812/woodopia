from django.db import transaction

from evaluation.services import evaluate_tender

from organizations.models import Membership

from .models import (
    Tender,
    Bid,
    TenderAward,
    CustomerTenderSelection,
)


def get_active_membership(user, organization):
    return (
        Membership.objects
        .filter(
            user=user,
            organization=organization,
            status="active",
        )
        .select_related(
            "organization",
            "role_fk",
        )
        .first()
    )


def get_customer_membership(user, tender):

    customer = tender.project.customer

    if customer.organization_type != "customer":
        return None


    membership = get_active_membership(
        user,
        customer,
    )

    if membership:
        return membership


    if customer.owner_id == user.id:
        return True


    return None

def get_workshop_membership(user, workshop):
    if workshop.organization_type != "workshop":
        return None

    return get_active_membership(
        user,
        workshop,
    )


def award_tender(tender_id, bid_id, user):

    tender = Tender.objects.get(
        id=tender_id
    )

    bid = Bid.objects.get(
        id=bid_id
    )

    if not get_customer_membership(user, tender):
        raise ValueError(
            "User is not authorized to award this tender."
        )

    if bid.tender_round.tender_id != tender.id:
        raise ValueError(
            "Bid does not belong to this tender."
        )

    if tender.status in {
        "awarded",
        "cancelled",
    }:
        raise ValueError(
            "Tender cannot be awarded."
        )

    if tender.status != "revealed":
        raise ValueError(
            "Tender is not revealed yet."
        )

    if TenderAward.objects.filter(
        tender=tender
    ).exists():
        raise ValueError(
            "Tender already has an award."
        )

    evaluation = evaluate_tender(
        tender.id
    )

    allowed_bid_ids = [
        item["bid_id"]
        for item in evaluation["results"][:3]
    ]

    if bid.id not in allowed_bid_ids:
        raise ValueError(
            "Selected bid is not available for award."
        )

    with transaction.atomic():

        award = TenderAward.objects.create(
            tender=tender,
            bid=bid,
            awarded_by=user,
        )

        tender.status = "awarded"

        tender.save(
            update_fields=[
                "status"
            ]
        )

    return award


def select_tender_bid(
    tender_id,
    bid_id,
    user,
):

    tender = Tender.objects.get(
        id=tender_id
    )

    bid = Bid.objects.get(
        id=bid_id
    )

    if bid.tender_round.tender_id != tender.id:
        raise ValueError(
            "Bid does not belong to this tender."
        )

    if tender.status != "revealed":
        raise ValueError(
            "Tender is not available for selection."
        )

    if not get_customer_membership(user, tender):
        raise ValueError(
            "User is not authorized to select this tender."
        )

    if TenderAward.objects.filter(
        tender=tender
    ).exists():
        raise ValueError(
            "Tender already has a final award."
        )

    evaluation = evaluate_tender(
        tender.id
    )

    allowed_bid_ids = [
        item["bid_id"]
        for item in evaluation["results"][:3]
    ]

    if bid.id not in allowed_bid_ids:
        raise ValueError(
            "Selected bid is not in top 3."
        )

    with transaction.atomic():

        selection, created = (
            CustomerTenderSelection.objects.update_or_create(
                tender=tender,
                defaults={
                    "bid": bid,
                    "selected_by": user,
                    "status": "selected",
                },
            )
        )

    return selection


from .permissions import get_bid_visibility_role
from .visibility import tender_is_revealed


def get_visible_bids(
    tender,
    role,
    workshop=None,
):

    if not tender_is_revealed(tender):
        raise ValueError(
            "Tender results are not revealed yet."
        )

    visibility = get_bid_visibility_role(role)

    bids = Bid.objects.filter(
        tender_round__tender=tender
    )

    if visibility == "top_3":

        evaluation = evaluate_tender(
            tender.id
        )

        top_ids = [
            item["bid_id"]
            for item in evaluation["results"][:3]
        ]

        return bids.filter(
            id__in=top_ids
        )

    if visibility == "own":

        if not workshop:
            return bids.none()

        return bids.filter(
            workshop=workshop
        )

    if visibility == "all":

        return bids

    return bids.none()