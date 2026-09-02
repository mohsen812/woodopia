from django.db import transaction
from django.utils import timezone

from evaluation.services import evaluate_round

from .models import Tender


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

    with transaction.atomic():

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