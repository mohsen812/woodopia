from django.db import transaction
from django.utils import timezone

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

    with transaction.atomic():

        tender.status = "revealed"

        tender.revealed_at = timezone.now()

        tender.save(
            update_fields=[
                "status",
                "revealed_at",
            ]
        )

    return tender
