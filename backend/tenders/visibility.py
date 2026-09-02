from django.utils import timezone

from evaluation.services import evaluate_tender

from .models import Bid


def tender_is_revealed(tender):

    if tender.revealed_at:
        return True

    if not tender.reveal_at:
        return False

    return timezone.now() >= tender.reveal_at



def get_visible_bids(
    tender,
    viewer_type,
    organization=None,
):

    if not tender_is_revealed(tender):

        return Bid.objects.none()


    bids = Bid.objects.filter(
        tender_round__tender=tender
    )


    if viewer_type == "consultant":

        return bids


    if viewer_type == "workshop":

        if not organization:
            return Bid.objects.none()

        return bids.filter(
            workshop=organization
        )


    if viewer_type == "customer":

        evaluation = evaluate_tender(
            tender.id
        )

        top_bid_ids = [
            item["bid_id"]
            for item in evaluation["results"][:3]
        ]

        return bids.filter(
            id__in=top_bid_ids
        )


    return Bid.objects.none()