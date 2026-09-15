from django.db import transaction

from organizations.models import Membership

from .models import Project, ProjectAssignment


def get_consultant_queue():
    """
    Return projects waiting for a consultant.

    A project is in the consultant queue when:
    - its status is consulting
    - it has no active assignment
    """

    return (
        Project.objects
        .filter(status="consulting")
        .exclude(
            assignments__status="active"
        )
        .distinct()
        .order_by("-created_at")
    )


@transaction.atomic
def send_project_to_consultant(project):
    """
    Move project into consultant queue.
    """

    if project.status != "draft":
        raise ValueError(
            "Only draft projects can be sent to consultant."
        )

    project.status = "consulting"

    project.save(
        update_fields=[
            "status",
            "updated_at",
        ]
    )

    return project
def claim_project(project, membership):
    """
    Assign a project to a consultant.

    The membership must belong to an active consultant.
    """

    if membership.status != "active":
        raise ValueError(
            "Consultant membership is not active."
        )

    if not membership.role_fk:
        raise ValueError(
            "Membership has no organization role."
        )

    if membership.role_fk.name != "consultant":
        raise ValueError(
            "Membership is not a consultant."
        )

    if project.status != "consulting":
        raise ValueError(
            "Project is not available for consultant review."
        )

    assignment = (
        ProjectAssignment.objects
        .select_for_update()
        .filter(
            project=project,
            status="active",
        )
        .first()
    )

    if assignment:
        raise ValueError(
            "Project has already been claimed."
        )

    return ProjectAssignment.objects.create(
        project=project,
        membership=membership,
        assigned_by=None,
        status="active",
    )
def get_consultant_projects(membership):
    """
    Return projects assigned to a consultant.
    """

    return (
        Project.objects
        .filter(
            assignments__membership=membership,
            assignments__status="active",
        )
        .distinct()
        .order_by("-updated_at")
    )
def get_consultant_dashboard_counts(membership):
    """
    Return dashboard counts for a consultant.
    """

    queue_count = get_consultant_queue().count()

    my_projects_count = (
        Project.objects
        .filter(
            assignments__membership=membership,
            assignments__status="active",
        )
        .distinct()
        .count()
    )

    active_tenders_count = (
        Project.objects
        .filter(
            assignments__membership=membership,
            assignments__status="active",
            tenders__status__in=[
                "open",
                "closed",
                "revealed",
            ],
        )
        .distinct()
        .count()
    )

    return {
        "queue_count": queue_count,
        "my_projects_count": my_projects_count,
        "active_tenders_count": active_tenders_count,
    }
