from django.shortcuts import render, redirect
from django.http import (
    JsonResponse,
    HttpResponseBadRequest,
    HttpResponseForbidden,
)
from django.contrib.auth.decorators import login_required

from organizations.models import Membership

from .services import (
    get_workspace_identity,
    get_user_workspaces,
    get_active_membership,
    set_active_membership,
    clear_active_membership,
    get_workspace_for_membership,
)


def _get_workspace_template(workspace):
    """
    Return the existing template for a workspace type.
    """

    workspace_type = workspace.get("workspace")

    if workspace_type == "consultant":
        return "workspace/consultant/index.html"

    if workspace_type == "customer":
        return "workspace/customer/index.html"

    if workspace_type == "workshop":
        return "workspace/workshop/index.html"

    return None


def _render_active_workspace(request, membership):
    """
    Render the workspace represented by the active Membership.
    """

    workspace = get_workspace_for_membership(
        membership
    )

    template = _get_workspace_template(
        workspace
    )

    if not template:
        return None

    return render(
        request,
        template,
    )


@login_required
def workspace_page(request):
    """
    FEEMAAS workspace gateway and workspace entry point.
    """

    user = request.user

    # Staff and superusers keep the administration context.
    if user.is_superuser or user.is_staff:
        return redirect("/admin/")

    workspaces = get_user_workspaces(user)

    # No active Membership.
    if not workspaces:
        clear_active_membership(request)
        return redirect("/")

    # Try the Membership currently stored in the session.
    active_membership = get_active_membership(request)

    if active_membership:

        response = _render_active_workspace(
            request,
            active_membership,
        )

        if response is not None:
            return response

        clear_active_membership(request)

    # Exactly one active Membership:
    # select it automatically.
    if len(workspaces) == 1:

        membership = (
            Membership.objects
            .select_related(
                "organization",
                "role_fk",
            )
            .get(
                id=workspaces[0]["membership_id"],
                user=user,
                status="active",
            )
        )

        set_active_membership(
            request,
            membership,
        )

        response = _render_active_workspace(
            request,
            membership,
        )

        if response is not None:
            return response

        clear_active_membership(request)

        return redirect("/")

    # Multiple active Memberships:
    # require explicit user selection.
    return render(
        request,
        "workspace/index.html",
        {
            "workspaces": workspaces,
        },
    )


@login_required
def switch_workspace(request):
    """
    Switch the active workspace context.

    The Membership must belong to the current user and
    must still be active.
    """

    if request.method != "POST":
        return HttpResponseBadRequest(
            "Workspace switch requires POST."
        )

    membership_id = request.POST.get(
        "membership_id"
    )

    if not membership_id:
        return HttpResponseBadRequest(
            "membership_id is required."
        )

    try:
        membership = (
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
        return HttpResponseForbidden(
            "Invalid workspace membership."
        )

    set_active_membership(
        request,
        membership,
    )

    response = _render_active_workspace(
        request,
        membership,
    )

    if response is not None:
        return response

    clear_active_membership(request)

    return HttpResponseBadRequest(
        "Unsupported workspace type."
    )


@login_required
def identity(request):

    data = get_workspace_identity(
        request.user,
        request,
    )

    return JsonResponse(
        data
    )
