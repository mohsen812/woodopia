from .models import Membership


def get_membership(user, organization):
    """
    Return user's membership in an organization.
    """

    return Membership.objects.filter(
        user=user,
        organization=organization,
        status="active"
    ).select_related(
        "role_fk"
    ).first()


def has_role(user, organization, role_name):
    """
    Check if user has a specific role in organization.
    """

    membership = get_membership(
        user,
        organization
    )

    if not membership or not membership.role_fk:
        return False

    return membership.role_fk.name == role_name



def has_permission(user, organization, permission_code):
    """
    Check if user has a specific permission in organization.
    """

    membership = get_membership(
        user,
        organization
    )

    if not membership:
        return False

    if not membership.role_fk:
        return False

    return membership.role_fk.role_permissions.filter(
        permission__code=permission_code
    ).exists()



def get_user_permissions(user, organization):
    """
    Return all permissions of user in organization.
    """

    membership = get_membership(
        user,
        organization
    )

    if not membership or not membership.role_fk:
        return []

    return list(
        membership.role_fk.role_permissions.values_list(
            "permission__code",
            flat=True
        )
    )
