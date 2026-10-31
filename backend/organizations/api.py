import json

from django.db import transaction
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required

from .models import Organization, Membership
from .services import get_membership
from workspace.services import get_active_membership


@login_required
def my_organizations(request):
    """
    Return organizations where the current user
    has an active membership.
    """

    memberships = (
        Membership.objects
        .filter(
            user=request.user,
            status="active"
        )
        .select_related("organization", "role_fk")
    )

    organizations = []

    for membership in memberships:
        organization = membership.organization

        organizations.append({
            "id": organization.id,
            "name": organization.name,
            "organization_type": organization.organization_type,
            "status": organization.status,
            "role": (
                membership.role_fk.name
                if membership.role_fk
                else membership.role
            ),
        })

    return JsonResponse({
        "organizations": organizations
    })


@login_required
def organization_detail(request, organization_id):
    """
    Return details of one organization
    if the current user is an active member.
    """

    try:
        membership = (
            Membership.objects
            .select_related(
                "organization",
                "role_fk"
            )
            .get(
                user=request.user,
                organization_id=organization_id,
                status="active"
            )
        )

    except Membership.DoesNotExist:
        return JsonResponse(
            {
                "error": "You are not an active member of this organization."
            },
            status=403
        )

    organization = membership.organization

    return JsonResponse({
        "id": organization.id,
        "name": organization.name,
        "organization_type": organization.organization_type,
        "status": organization.status,
        "role": (
            membership.role_fk.name
            if membership.role_fk
            else membership.role
        ),
    })
    
@login_required
def workshop_list(request):
    """
    Return active workshops for tender selection.
    """

    workshops = (
        Organization.objects
        .filter(
            organization_type="workshop",
            status="active",
        )
        .order_by("name")
    )

    data = []

    for workshop in workshops:

        data.append({
            "id": workshop.id,
            "name": workshop.name,
            "organization_type": workshop.organization_type,
            "status": workshop.status,
            "is_tender_available": workshop.is_tender_available,
        })

    return JsonResponse({
        "workshops": data
    })


@login_required
@require_POST
def workshop_tender_availability(request):
    """
    Change availability for new tender invitations in the active workshop.
    Only the workshop owner or an active owner/manager membership may change it.
    """

    membership = get_active_membership(request)

    if not membership or membership.organization.organization_type != "workshop":
        return JsonResponse(
            {"error": "ابتدا وارد پیشخوان یک کارگاه شوید."},
            status=403,
        )

    organization = membership.organization
    role = (
        membership.role_fk.name
        if membership.role_fk
        else membership.role
    )

    can_manage = (
        organization.owner_id == request.user.id
        or role in ("owner", "manager")
    )

    if not can_manage:
        return JsonResponse(
            {"error": "اجازه تغییر دسترس‌پذیری مناقصه را ندارید."},
            status=403,
        )

    try:
        payload = json.loads(request.body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return JsonResponse(
            {"error": "درخواست نامعتبر است."},
            status=400,
        )

    available = payload.get("is_tender_available")
    if type(available) is not bool:
        return JsonResponse(
            {"error": "وضعیت ارسالی باید روشن یا خاموش باشد."},
            status=400,
        )

    from operations.models import TenderAvailabilityLog

    with transaction.atomic():
        organization = (
            Organization.objects
            .select_for_update()
            .get(pk=organization.pk, organization_type="workshop")
        )

        previous = organization.is_tender_available

        if previous != available:
            organization.is_tender_available = available
            organization.save(update_fields=["is_tender_available", "updated_at"])

            TenderAvailabilityLog.objects.create(
                organization=organization,
                previous_available=previous,
                new_available=available,
                changed_by=request.user,
            )

    return JsonResponse({
        "success": True,
        "is_tender_available": organization.is_tender_available,
    })
