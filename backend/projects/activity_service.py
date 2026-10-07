from .models import ProjectActivity


def create_project_activity(
    project,
    event_type,
    actor=None,
    metadata=None,
):
    """
    Create a project activity log entry.

    This service is the single entry point for:
    - timeline events
    - notifications (future)
    - audit history (future)
    """

    return ProjectActivity.objects.create(
        project=project,
        event_type=event_type,
        actor=actor,
        metadata=metadata or {},
    )