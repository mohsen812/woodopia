from django.http import JsonResponse
from projects.models import Project


def project_graph(request, project_id):

    try:
        project = Project.objects.get(id=project_id)

    except Project.DoesNotExist:
        return JsonResponse(
            {
                "error": "Project not found"
            },
            status=404
        )


    nodes = []
    edges = []


    for item in project.items.all():

        for subproject in item.subprojects.all():

            nodes.append(
                {
                    "id": subproject.id,
                    "name": subproject.name,
                    "type": (
                        subproject.subproject_type.name
                        if subproject.subproject_type
                        else None
                    ),
                    "status": subproject.status,
                    "organization": (
                        subproject.assigned_organization.name
                        if subproject.assigned_organization
                        else None
                    )
                }
            )


            for dependency in subproject.outgoing_dependencies.all():

                edges.append(
                    {
                        "source": dependency.from_subproject.id,
                        "target": dependency.to_subproject.id,
                        "type": dependency.dependency_type,
                        "status": dependency.status,
                        "delay_days": dependency.delay_days,
                        "is_blocking": dependency.is_blocking
                    }
                )


    return JsonResponse(
        {
            "project": project.title,
            "nodes": nodes,
            "edges": edges
        }
    )
