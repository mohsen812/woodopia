from organizations.models import Membership


def get_user_workspaces(user):
    """
    Return all active workspaces
    for a user.
    """

    memberships = (
        Membership.objects
        .filter(
            user=user,
            status="active"
        )
        .select_related(
            "organization",
            "role_fk"
        )
    )

    workspaces = []

    for membership in memberships:

        workspaces.append(
            {
                "organization_id": membership.organization.id,

                "organization_name": membership.organization.name,

                "type": membership.organization.organization_type,

                "role": (
                    membership.role_fk.name
                    if membership.role_fk
                    else membership.role
                )
            }
        )

    return workspaces



def get_workspace_identity(user):
    """
    Return current workspace identity.
    Used by FEEMAAS workspace shell.
    """

    workspaces = get_user_workspaces(user)

    primary = None

    if workspaces:
        primary = workspaces[0]


    return {

        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
        },

        "primary_workspace": primary,

        "workspaces": workspaces,
    }