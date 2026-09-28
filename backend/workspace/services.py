from organizations.models import Membership


ACTIVE_MEMBERSHIP_SESSION_KEY = "active_membership_id"


def _get_membership_role(membership):
    return (
        membership.role_fk.name
        if membership.role_fk
        else membership.role
    )


def _get_workspace_type(membership):
    role = _get_membership_role(membership)

    if role in ["consultant", "designer"]:
        return role

    return membership.organization.organization_type


def get_workspace_for_membership(membership):
    """
    Return the workspace context represented by a Membership.
    """

    role = _get_membership_role(membership)

    return {
        "membership_id": membership.id,
        "organization_id": membership.organization.id,
        "organization_name": membership.organization.name,
        "type": membership.organization.organization_type,
        "role": role,
        "workspace": _get_workspace_type(membership),
    }


def get_user_workspaces(user):
    """
    Return all active Membership-based workspaces for a user.
    """

    memberships = (
        Membership.objects
        .filter(
            user=user,
            status="active",
        )
        .select_related(
            "organization",
            "role_fk",
        )
    )

    return [
        get_workspace_for_membership(membership)
        for membership in memberships
    ]


def get_active_membership(request):
    """
    Return the Membership selected in the current session.

    The session value is always validated against the current user
    and active Membership status.
    """

    membership_id = request.session.get(
        ACTIVE_MEMBERSHIP_SESSION_KEY
    )

    if not membership_id:
        return None

    try:
        return (
            Membership.objects
            .select_related(
                "organization",
                "role_fk",
            )
            .get(
                id=membership_id,
                user=request.user,
                status="active",
            )
        )
    except Membership.DoesNotExist:
        request.session.pop(
            ACTIVE_MEMBERSHIP_SESSION_KEY,
            None,
        )

        return None


def set_active_membership(request, membership):
    """
    Store the selected Membership in the current session.
    """

    request.session[
        ACTIVE_MEMBERSHIP_SESSION_KEY
    ] = membership.id

    request.session.modified = True


def clear_active_membership(request):
    """
    Remove the active Membership from the session.
    """

    request.session.pop(
        ACTIVE_MEMBERSHIP_SESSION_KEY,
        None,
    )


def get_workspace_identity(user, request=None):
    """
    Return the user's workspace identity.

    The user argument keeps this service independent from Django's
    request object.

    When request is supplied, active_workspace is resolved from the
    session's active_membership_id.

    Without a request, no Membership is implicitly selected.
    """

    if user.is_superuser or user.is_staff:
        return {
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            },
            "active_workspace": {
                "type": "admin",
                "name": "FEEMAAS Administration",
                "role": "administrator",
            },
            "workspaces": [],
        }

    workspaces = get_user_workspaces(user)

    active_workspace = None

    if request is not None:
        active_membership = get_active_membership(request)

        if active_membership:
            active_workspace = get_workspace_for_membership(
                active_membership
            )

    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
        },
        "active_workspace": active_workspace,
        "workspaces": workspaces,
    }
