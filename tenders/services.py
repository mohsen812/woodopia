from django.db import transaction

from evaluation.services import evaluate_tender

from .models import Tender, Bid, TenderAward


def award_tender(tender_id, bid_id, user):

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

    if tender.status in {"awarded", "cancelled"}:
        raise ValueError(
            "Tender cannot be awarded."
        )

    if tender.status != "closed":
        raise ValueError(
            "Tender is not ready for award."
        )

    evaluation = evaluate_tender(
        tender.id
    )

    top_bid_ids = [
        item["bid_id"]
        for item in evaluation["results"][:3]
    ]

    if bid.id not in top_bid_ids:
        raise ValueError(
            "Selected bid is not in top 3 ranking."
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