from django.db import transaction
from django.utils import timezone

from evaluation.services import evaluate_round

from .models import (

    Tender,

    TenderRoundEvaluation,

)


def reveal_tender(tender_id):

    tender = Tender.objects.get(
        id=tender_id
    )

    if tender.status != "closed":
        raise ValueError(
            "Tender is not closed."
        )

    if not tender.reveal_at:
        raise ValueError(
            "Reveal time is not defined."
        )

    if timezone.now() < tender.reveal_at:
        raise ValueError(
            "Reveal time has not arrived."
        )

    active_round = (
        tender.rounds
        .filter(
            status="closed"
        )
        .order_by(
            "-round_number"
        )
        .first()
    )

    if not active_round:
        raise ValueError(
            "No closed round available for evaluation."
        )

    evaluation = evaluate_round(
        active_round.id
    )

    winner_bid_id = (
        evaluation["winner"]["bid_id"]
        if evaluation.get("winner")
        else None
    )

    with transaction.atomic():

        winner_bid = None

        if winner_bid_id:
            from .models import Bid

            winner_bid = Bid.objects.get(
                id=winner_bid_id
            )

        TenderRoundEvaluation.objects.create(
            tender_round=active_round,
            winner_bid=winner_bid,
            ranking=evaluation.get(
                "ranking",
                []
            ),
            summary=evaluation,
        )

        active_round.status = "evaluated"

        active_round.save(
            update_fields=[
                "status"
            ]
        )

        tender.status = "revealed"

        tender.revealed_at = timezone.now()

        tender.save(
            update_fields=[
                "status",
                "revealed_at",
            ]
        )



    return tender