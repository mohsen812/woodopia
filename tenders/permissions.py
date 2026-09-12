from .visibility import tender_is_revealed


def can_view_bids(tender):
    return tender_is_revealed(tender)


def get_bid_visibility_role(role):
    if role == "customer":
        return "top_3"

    if role == "consultant":
        return "all"

    if role == "workshop":
        return "own"

    return "none"