from organizations.models import Membership


def get_user_landing_page(user):

    # همه کاربران محصول، از Workspace وارد می‌شوند.
    if user.is_staff or user.is_superuser:
        return "/workspace/"

    membership = (
        Membership.objects
        .filter(
            user=user,
            status="active"
        )
        .select_related(
            "organization"
        )
        .first()
    )

    if not membership:
        return "/"

    org_type = (
        membership.organization.organization_type
    )

    if org_type in [
        "customer",
        "workshop",
        "designer",
        "company",
    ]:
        return "/workspace/"

    return "/"
