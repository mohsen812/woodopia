from django.db import transaction
from django.utils import timezone

from decimal import Decimal

from evaluation.services import evaluate_round

from .models import (
    Bid,
    Tender,
    TenderRoundEvaluation,
)

def _json_safe(value):
    if isinstance(value, Decimal):
        return str(value)

    if isinstance(value, dict):
        return {
            key: _json_safe(item)
            for key, item in value.items()
        }

    if isinstance(value, (list, tuple)):
        return [_json_safe(item) for item in value]

    return value

def reveal_tender(tender_id):
    with transaction.atomic():
        tender = Tender.objects.select_for_update().get(
            id=tender_id
        )

        if tender.status != "closed":
            raise ValueError(
                "Tender is not closed."
            )

        if tender.pre_reveal_approved_at is None:
            raise ValueError(
                "Consultant approval is required before reveal."
            )




        active_round = (
            tender.rounds
            .filter(status="closed")
            .order_by("-round_number")
            .first()
        )

        if not active_round:
            raise ValueError(
                "No closed round available for evaluation."
            )

        pending_bids_exist = Bid.objects.filter(
            tender_round=active_round,
            status="submitted",
            review_status="pending",
        ).exists()

        if pending_bids_exist:
            raise ValueError(
                "All submitted bids must be reviewed before reveal."
            )

        eligible_bids_exist = Bid.objects.filter(
            tender_round=active_round,
            status="submitted",
            review_status="approved",
        ).exists()

        if not eligible_bids_exist:
            raise ValueError(
                "No eligible bids remain for reveal."
            )

        evaluation = evaluate_round(active_round.id)

        winner_bid_id = (
            evaluation["summary"]["winner_bid_id"]
            if evaluation.get("summary")
            else None
        )

        winner_bid = None
        if winner_bid_id:
            winner_bid = Bid.objects.get(
                id=winner_bid_id,
                tender_round=active_round,
            )

        TenderRoundEvaluation.objects.create(
            tender_round=active_round,
            winner_bid=winner_bid,
            ranking=_json_safe(
                evaluation.get("results", [])
            ),
            summary=_json_safe(evaluation),
        )

        active_round.status = "evaluated"
        active_round.save(update_fields=["status"])

        tender.status = "revealed"
        tender.revealed_at = timezone.now()
        tender.save(update_fields=["status", "revealed_at"])

        return tender
