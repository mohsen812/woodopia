from django.contrib import messages
from django.contrib.auth import logout, update_session_auth_hash
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from django.db import transaction
from datetime import timedelta

from django.db.models import Count, Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.http import require_GET, require_POST

from access.models import AccessRequest
from access.services import approve_access_request
from organizations.models import Membership, Organization, OrganizationApplication
from operations.models import OnlineUserSnapshot, UserPresence
from projects.models import Project
from django.contrib.auth import get_user_model


OPERATIONS_GROUP_NAME = "FEEMAAS Operations"


def _require_operations_access(user):
    if not user.groups.filter(name=OPERATIONS_GROUP_NAME).exists():
        raise PermissionDenied


@login_required
def operations_dashboard(request):
    _require_operations_access(request.user)

    if request.method == "POST":
        return redirect("operations:dashboard")

    User = get_user_model()

    projects_by_status = list(
        Project.objects.values("status")
        .annotate(total=Count("id"))
        .order_by("status")
    )

    project_total = Project.objects.count()
    completed_projects = Project.objects.filter(status="completed").count()
    closed_projects = Project.objects.filter(
        status__in=["completed", "cancelled"]
    ).count()

    access_total = AccessRequest.objects.count()
    access_reviewed = AccessRequest.objects.filter(
        status__in=["approved", "rejected"]
    ).count()

    for item in projects_by_status:
        item["label"] = dict(Project.STATUS_CHOICES).get(
            item["status"], item["status"]
        )
        item["percentage"] = round(
            item["total"] * 100 / project_total
        ) if project_total else 0

    organization_user_counts = {}
    for organization_type, _label in Organization.ORGANIZATION_TYPES:
        organization_user_counts[organization_type] = User.objects.filter(
            is_active=True
        ).filter(
            Q(
                owned_organizations__organization_type=organization_type,
                owned_organizations__status="active",
            )
            | Q(
                memberships__organization__organization_type=organization_type,
                memberships__organization__status="active",
                memberships__status="active",
            )
        ).distinct().count()

    operations_user_count = User.objects.filter(
        is_active=True,
        groups__name=OPERATIONS_GROUP_NAME,
    ).distinct().count()

    context = {
        "organization_user_counts": organization_user_counts,
        "operations_user_count": operations_user_count,
        "total_users": User.objects.count(),
        "active_users": User.objects.filter(is_active=True).count(),
        "total_organizations": Organization.objects.count(),
        "active_organizations": Organization.objects.filter(
            status="active"
        ).count(),
        "pending_organizations": Organization.objects.filter(
            status="pending"
        ).count(),
        "total_projects": project_total,
        "completed_projects": completed_projects,
        "open_projects": Project.objects.exclude(
            status__in=["completed", "cancelled"]
        ).count(),
        "projects_by_status": projects_by_status,
        "project_status_labels": dict(Project.STATUS_CHOICES),
        "pending_access_requests": AccessRequest.objects.filter(
            status="pending"
        ).select_related("user").order_by("-created_at")[:12],
        "pending_access_count": AccessRequest.objects.filter(
            status="pending"
        ).count(),
        "recent_access_requests": AccessRequest.objects.select_related(
            "user", "reviewed_by"
        ).order_by("-created_at")[:8],
        "pending_applications": OrganizationApplication.objects.filter(
            status__in=["pending", "edit_required"]
        ).select_related("applicant").order_by("-created_at")[:8],
        "pending_application_count": OrganizationApplication.objects.filter(
            status__in=["pending", "edit_required"]
        ).count(),
        "total_access_requests": access_total,
        "reviewed_access_requests": access_reviewed,
        "review_rate": round(access_reviewed * 100 / access_total)
        if access_total else 0,
        "completion_rate": round(completed_projects * 100 / project_total)
        if project_total else 0,
        "project_close_rate": round(closed_projects * 100 / project_total)
        if project_total else 0,
        "now": timezone.localtime(),
    }

    context["project_close_angle"] = (
        context["project_close_rate"] * 1.8 - 90
    )
    context["review_angle"] = context["review_rate"] * 1.8 - 90

    return render(request, "operations/dashboard.html", context)


@login_required
@require_GET
def api_online_users(request):
    _require_operations_access(request.user)

    now = timezone.now()
    minute_bucket = now.replace(second=0, microsecond=0)
    online_cutoff = now - timedelta(minutes=5)

    online_count = UserPresence.objects.filter(
        last_seen__gte=online_cutoff,
        user__is_active=True,
    ).count()

    OnlineUserSnapshot.objects.update_or_create(
        recorded_at=minute_bucket,
        defaults={"online_count": online_count},
    )

    snapshots = OnlineUserSnapshot.objects.filter(
        recorded_at__gte=minute_bucket - timedelta(minutes=59),
        recorded_at__lte=minute_bucket,
    ).order_by("recorded_at")

    return JsonResponse({
        "online_count": online_count,
        "window_minutes": 5,
        "recorded_at": now.isoformat(),
        "points": [
            {
                "time": item.recorded_at.isoformat(),
                "count": item.online_count,
            }
            for item in snapshots
        ],
    })


@login_required
@require_POST
def review_access_request(request, request_id):
    _require_operations_access(request.user)

    action = request.POST.get("action", "").strip()

    with transaction.atomic():
        access_request = get_object_or_404(
            AccessRequest.objects.select_for_update(),
            pk=request_id,
        )

        if access_request.status != "pending":
            messages.warning(
                request,
                "این درخواست قبلاً بررسی شده است؛ وضعیت آن تغییر نکرد.",
            )
            return redirect("operations:dashboard")

        if action == "approve":
            approve_access_request(access_request.pk, request.user)
            messages.success(
                request,
                "درخواست تأیید شد و سازمان و عضویت مربوطه ایجاد شدند.",
            )

        elif action == "reject":
            access_request.status = "rejected"
            access_request.reviewed_by = request.user
            access_request.reviewed_at = timezone.now()
            access_request.save(
                update_fields=["status", "reviewed_by", "reviewed_at"]
            )
            messages.success(request, "درخواست با موفقیت رد شد.")

        else:
            messages.error(request, "عملیات درخواستی معتبر نیست.")

    return redirect("operations:dashboard")



@login_required
def operations_account(request):
    _require_operations_access(request.user)

    form = PasswordChangeForm(request.user)

    if request.method == "POST":
        action = request.POST.get("action", "").strip()

        if action == "logout":
            logout(request)
            return redirect("/")

        if action == "change_password":
            form = PasswordChangeForm(request.user, request.POST)
            if form.is_valid():
                user = form.save()
                update_session_auth_hash(request, user)
                messages.success(request, "رمز عبور با موفقیت تغییر کرد.")
                return redirect("operations:account")
            messages.error(request, "لطفاً خطاهای فرم تغییر رمز را بررسی کنید.")
        else:
            messages.error(request, "عملیات درخواستی معتبر نیست.")

    return render(
        request,
        "operations/account.html",
        {"form": form},
    )
