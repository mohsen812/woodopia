from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required

from .services import get_workspace_identity


@login_required
def workspace_page(request):

    identity = get_workspace_identity(
        request.user
    )

    primary_workspace = (
        identity.get("primary_workspace")
    )

    workspace_type = (
        primary_workspace.get("type")
        if primary_workspace
        else None
    )

    if workspace_type == "customer":

        template = (
            "workspace/customer/index.html"
        )

    elif workspace_type == "workshop":

        template = (
            "workspace/workshop/index.html"
        )

    else:

        # UI اختصاصی این نقش هنوز ساخته نشده.
        # فعلاً از Customer Workspace به عنوان
        # fallback موقت استفاده می‌کنیم.
        template = (
            "workspace/customer/index.html"
        )

    return render(
        request,
        template
    )


@login_required
def identity(request):

    data = get_workspace_identity(
        request.user
    )

    return JsonResponse(
        data
    )