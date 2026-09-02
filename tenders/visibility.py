from django.utils import timezone


def tender_is_revealed(tender):

    if tender.revealed_at:
        return True

    if not tender.reveal_at:
        return False

    return timezone.now() >= tender.reveal_at
