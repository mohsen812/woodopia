from datetime import timedelta

from django.utils import timezone


class UserPresenceMiddleware:
    """
    Record authenticated user activity without writing on every request.

    The online-chart data endpoint is deliberately excluded so polling
    the dashboard does not keep every user online.
    """

    UPDATE_INTERVAL_SECONDS = 30
    EXCLUDED_PATHS = (
        "/operations/api/online-users/",
    )

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        user = getattr(request, "user", None)
        path = request.path

        if (
            user is not None
            and user.is_authenticated
            and user.is_active
            and not any(path.startswith(item) for item in self.EXCLUDED_PATHS)
        ):
            self._record_activity(user.pk)

        return response

    def _record_activity(self, user_id):
        from operations.models import UserPresence

        now = timezone.now()
        threshold = now - timedelta(
            seconds=self.UPDATE_INTERVAL_SECONDS
        )

        presence, created = UserPresence.objects.get_or_create(
            user_id=user_id,
            defaults={"last_seen": now},
        )

        if not created and presence.last_seen < threshold:
            UserPresence.objects.filter(
                pk=presence.pk,
                last_seen=presence.last_seen,
            ).update(last_seen=now)
