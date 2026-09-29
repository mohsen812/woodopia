from django.utils import timezone
from django.db import transaction

from access.models import AccessRequest

from organizations.models import (
    Organization,
    Membership,
    OrganizationRole,
)


def get_role_for_request(request_type):
    """
    Map access request type to organization role.
    """

    mapping = {
        "workshop": "owner",
        "consultant": "consultant",
        "designer": "designer",
    }

    return mapping.get(
        request_type,
        "member",
    )


@transaction.atomic
def approve_access_request(
    access_request_id,
    reviewer,
):
    """
    Approve an access request and create workspace access.
    """

    access_request = (
        AccessRequest.objects
        .select_for_update()
        .get(
            id=access_request_id
        )
    )


    if access_request.status != "pending":
        return access_request


    organization = Organization.objects.create(
        name=(
            access_request.organization_name
            or
            f"{access_request.user.username} "
            f"{access_request.requested_type}"
        ),

        organization_type=(
            access_request.requested_type
        ),

        owner=access_request.user,
    )


    role_name = get_role_for_request(
        access_request.requested_type
    )


    role = (
        OrganizationRole.objects
        .filter(
            name=role_name
        )
        .first()
    )


    membership = Membership.objects.create(
        user=access_request.user,

        organization=organization,

        role=role_name,

        role_fk=role,

        status="active",
    )


    access_request.status = "approved"

    access_request.reviewed_by = reviewer

    access_request.reviewed_at = timezone.now()

    access_request.created_organization = organization

    access_request.created_membership = membership

    access_request.save()


    return access_request