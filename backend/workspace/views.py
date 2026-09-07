from django.http import JsonResponse
from django.contrib.auth.decorators import login_required

from organizations.models import Membership


@login_required
def workspace_me(request):

    memberships = (
        Membership.objects
        .filter(
            user=request.user,
            status="active"
        )
        .select_related(
            "organization",
            "role_fk"
        )
    )

    organizations = []

    for membership in memberships:

        organizations.append(
            {
                "id": membership.organization.id,
                "name": membership.organization.name,
                "type": membership.organization.organization_type,
                "role": (
                    membership.role_fk.name
                    if membership.role_fk
                    else membership.role
                )
            }
        )


    return JsonResponse(
        {
            "user": {
                "id": request.user.id,
                "username": request.user.username,
                "email": request.user.email,
            },

            "organizations": organizations
        }
    )