from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import Group
from django.core.exceptions import PermissionDenied
from django.shortcuts import render


OPERATIONS_GROUP_NAME = "FEEMAAS Operations"


@login_required
def operations_dashboard(request):
    if not request.user.groups.filter(
        name=OPERATIONS_GROUP_NAME
    ).exists():
        raise PermissionDenied

    return render(
        request,
        "operations/dashboard.html",
    )
