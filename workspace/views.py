from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required

from .services import get_workspace_identity


def workspace_page(request):

    return render(
        request,
        "workspace-classic/index.html"
    )


@login_required
def identity(request):

    data = get_workspace_identity(
        request.user
    )

    return JsonResponse(
        data
    )