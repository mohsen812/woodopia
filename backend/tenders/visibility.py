from .models import Bid


def tender_is_revealed(tender):
    """True only after the official reveal has been recorded."""
    return tender.revealed_at is not None


def tender_rankings_are_published(tender):
    """
    Rankings are visible to the customer only after both
    commission checks and the publication timestamp.
    """
    return bool(
        tender.commission_check_1
        and tender.commission_check_2
        and tender.rankings_published_at
    )


def get_tender_visibility(tender, viewer_type):
    """Central policy for tender information visibility."""

    policy = {
        "show_alias": False,
        "show_workshop_identity": False,
        "show_price": False,
        "show_score": False,
        "show_rank": False,
        "show_selection": False,
    }

    if viewer_type == "consultant":
        if not tender_is_revealed(tender):
            return {**policy, "show_alias": True}

        return {
            **policy,
            "show_alias": True,
            "show_workshop_identity": True,
            "show_price": True,
            "show_score": True,
            "show_rank": True,
        }

    if viewer_type == "workshop":
        return {**policy, "show_alias": True}

    if viewer_type == "customer":
        visibility = {
            **policy,
            "show_alias": True,
            "show_price": bool(tender.preliminary_approved_at),
        }

        if tender_rankings_are_published(tender):
            visibility.update({
                "show_workshop_identity": True,
                "show_score": True,
                "show_rank": True,
                "show_selection": True,
            })

        return visibility

    return policy


def get_visible_bids(tender, viewer_type, organization=None):
    """Return bids allowed for a viewer at the current tender stage."""

    bids = Bid.objects.filter(
        tender_round__tender=tender,
    )

    if viewer_type == "consultant":
        # Before official reveal, consultants may review submitted
        # bids only after the tender has been closed.
        if not tender_is_revealed(tender) and tender.status != "closed":
            return Bid.objects.none()

        return bids.filter(status="submitted")

    if viewer_type == "workshop":
        if organization is None:
            return Bid.objects.none()

        return bids.filter(workshop=organization)

    if viewer_type == "customer":
        # Customers may see submitted bids as anonymous cards
        # before preliminary approval. Serializer selection must
        # enforce which fields are returned at each stage.
        return bids.filter(status="submitted")

    return Bid.objects.none()
