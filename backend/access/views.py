import json
from urllib.parse import urlparse

from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_GET, require_POST

from .models import AccessRequest


ALLOWED_TYPES = {"workshop", "consultant", "designer"}
ALLOWED_NETWORKS = {"", "instagram", "linkedin", "website", "other"}


def _request_data(item):
    return {
        "id": item.pk,
        "requested_type": item.requested_type,
        "requested_type_display": item.get_requested_type_display(),
        "organization_name": item.organization_name,
        "message": item.message,
        "social_network": item.social_network,
        "social_profile": item.social_profile,
        "status": item.status,
        "created_at": timezone.localtime(item.created_at).strftime("%Y/%m/%d %H:%M"),
        "reviewed_at": (
            timezone.localtime(item.reviewed_at).strftime("%Y/%m/%d %H:%M")
            if item.reviewed_at else None
        ),
    }


@login_required
@require_GET
def collaboration_requests(request):
    items = AccessRequest.objects.filter(user=request.user).order_by("-created_at")
    return JsonResponse({"requests": [_request_data(item) for item in items[:50]]})


@login_required
@require_POST
def create_collaboration_request(request):
    try:
        data = json.loads(request.body.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({"error": "داده‌های ارسالی معتبر نیستند."}, status=400)

    if not isinstance(data, dict):
        return JsonResponse({"error": "ساختار درخواست معتبر نیست."}, status=400)

    requested_type = str(data.get("requested_type", "")).strip()
    organization_name = str(data.get("organization_name", "")).strip()
    message = str(data.get("message", "")).strip()
    social_network = str(data.get("social_network", "")).strip().lower()
    social_profile = str(data.get("social_profile", "")).strip()

    if requested_type not in ALLOWED_TYPES:
        return JsonResponse({"error": "نوع همکاری انتخاب‌شده معتبر نیست."}, status=400)

    if not organization_name or len(organization_name) > 255:
        return JsonResponse({"error": "نام مجموعه الزامی است و باید حداکثر ۲۵۵ نویسه باشد."}, status=400)

    if len(message) > 5000:
        return JsonResponse({"error": "توضیحات بیش از حد طولانی است."}, status=400)

    if social_network not in ALLOWED_NETWORKS:
        return JsonResponse({"error": "شبکهٔ اجتماعی انتخاب‌شده معتبر نیست."}, status=400)

    if len(social_profile) > 500:
        return JsonResponse({"error": "نشانی شبکهٔ اجتماعی بیش از حد طولانی است."}, status=400)

    if social_profile and not social_network:
        return JsonResponse({"error": "برای لینک اجتماعی، نوع شبکه را هم انتخاب کنید."}, status=400)

    if social_profile:
        candidate = social_profile
        if "://" not in candidate:
            candidate = "https://" + candidate
        parsed = urlparse(candidate)
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            return JsonResponse({"error": "لینک اجتماعی معتبر نیست؛ نشانی کامل یا نام کاربری وارد کنید."}, status=400)
        if any(char.isspace() for char in candidate):
            # Allow a plain social handle, but not malformed URLs.
            if candidate.startswith("https://") and "/" not in candidate[len("https://"):]:
                pass
            else:
                return JsonResponse({"error": "لینک اجتماعی معتبر نیست."}, status=400)
        social_profile = candidate

    with transaction.atomic():
        duplicate = AccessRequest.objects.filter(
            user=request.user,
            requested_type=requested_type,
            status="pending",
        ).first()

        if duplicate:
            return JsonResponse({
                "error": "برای این نوع همکاری یک درخواست در انتظار بررسی دارید.",
                "request": _request_data(duplicate),
            }, status=409)

        item = AccessRequest.objects.create(
            user=request.user,
            requested_type=requested_type,
            organization_name=organization_name,
            message=message,
            social_network=social_network,
            social_profile=social_profile,
        )

    return JsonResponse({
        "message": "درخواست همکاری ثبت شد و برای بررسی به پنل عملیات ارسال شد.",
        "request": _request_data(item),
    }, status=201)
