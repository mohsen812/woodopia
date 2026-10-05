from django.utils import timezone

from organizations.models import Membership
from .models import Bid, Tender, TenderParticipant


def is_manager(user):
    return bool(
        user
        and user.is_authenticated
        and (user.is_staff or user.is_superuser)
    )


def has_consultant_tender_access(user, tender):
    if is_manager(user):
        return True

    return Tender.objects.filter(
        id=tender.id,
        project__assignments__membership__user=user,
        project__assignments__membership__status="active",
        project__assignments__membership__role_fk__name="consultant",
        project__assignments__status="active",
    ).exists()


def has_customer_tender_access(user, tender):
    if is_manager(user):
        return True

    customer = tender.project.customer

    if Membership.objects.filter(
        user=user,
        organization=customer,
        status="active",
    ).exists():
        return True

    return customer.owner_id == user.id


def has_workshop_tender_access(user, tender):
    if is_manager(user):
        return True

    return TenderParticipant.objects.filter(
        tender=tender,
        organization__organization_type="workshop",
        organization__members__user=user,
        organization__members__status="active",
    ).exists()


def has_tender_metadata_access(user, tender):
    return (
        has_consultant_tender_access(user, tender)
        or has_customer_tender_access(user, tender)
        or has_workshop_tender_access(user, tender)
    )


def get_participant_for_user(user, participant):
    if is_manager(user):
        return participant

    if Membership.objects.filter(
        user=user,
        organization=participant.organization,
        status="active",
    ).exists():
        return participant

    return None


def has_project_access(user, project):
    if is_manager(user):
        return True

    if project.customer.owner_id == user.id:
        return True

    if Membership.objects.filter(
        user=user,
        organization=project.customer,
        status="active",
    ).exists():
        return True

    return project.assignments.filter(
        membership__user=user,
        membership__status="active",
        status="active",
    ).exists()


def has_consultant_project_access(user, project):
    if is_manager(user):
        return True

    return project.assignments.filter(
        membership__user=user,
        membership__status="active",
        membership__role_fk__name="consultant",
        status="active",
    ).exists()


def participant_is_accepted(participant):
    return participant.response_status == "accepted"


def workshop_can_edit_bid(user, bid):
    if is_manager(user):
        return True

    tender = bid.tender_round.tender

    if tender.status != "open":
        return False

    if bid.tender_round.status != "open":
        return False

    if tender.deadline and timezone.now() > tender.deadline:
        return False

    participant = TenderParticipant.objects.filter(
        tender=tender,
        organization=bid.workshop,
    ).first()

    if not participant or not participant_is_accepted(participant):
        return False

    return Membership.objects.filter(
        user=user,
        organization=bid.workshop,
        status="active",
    ).exists()


def customer_top3_bid_ids(tender):
    from evaluation.services import evaluate_tender

    evaluation = evaluate_tender(tender.id)

    return {
        item["bid_id"]
        for item in evaluation.get("results", [])[:3]
        if item.get("bid_id") is not None
    }


def can_view_bid(user, bid):
    tender = bid.tender_round.tender

    if is_manager(user):
        return True

    if has_consultant_tender_access(user, tender):
        return tender.revealed_at is not None

    if Membership.objects.filter(
        user=user,
        organization=bid.workshop,
        status="active",
    ).exists():
        return True

    if has_customer_tender_access(user, tender):
        from .visibility import tender_is_revealed

        return (
            tender_is_revealed(tender)
            and bid.id in customer_top3_bid_ids(tender)
        )

    return False


def can_view_all_bids(user, tender):
    if is_manager(user):
        return True

    from .visibility import tender_is_revealed

    return (
        tender_is_revealed(tender)
        and has_consultant_tender_access(user, tender)
    )


def can_view_customer_bids(user, tender):
    from .visibility import tender_is_revealed

    return (
        tender_is_revealed(tender)
        and has_customer_tender_access(user, tender)
    )


def can_view_own_workshop_bids(user, tender):
    from .visibility import tender_is_revealed

    return (
        tender_is_revealed(tender)
        and has_workshop_tender_access(user, tender)
    )


def has_tender_report_access(user, tender):
    if is_manager(user):
        return True

    return (
        has_consultant_tender_access(user, tender)
        or has_customer_tender_access(user, tender)
    )
