from django.http import JsonResponse
from django.contrib.auth.decorators import login_required

from .models import Organization, Membership
from .services import get_membership


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
