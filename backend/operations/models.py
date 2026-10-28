from django.conf import settings
from django.db import models


class UserPresence(models.Model):
    """
    Last recorded activity for each authenticated user.
    Online status is calculated from a configurable time window.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="operations_presence",
    )
    last_seen = models.DateTimeField(db_index=True)

    class Meta:
        verbose_name = "User presence"
        verbose_name_plural = "User presence"

    def __str__(self):
        return "{} — {}".format(self.user_id, self.last_seen)


class OnlineUserSnapshot(models.Model):
    """
    A persisted online-user count for a one-minute time bucket.
    """

    recorded_at = models.DateTimeField(unique=True, db_index=True)
    online_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["recorded_at"]
        verbose_name = "Online user snapshot"
        verbose_name_plural = "Online user snapshots"

    def __str__(self):
        return "{} — {}".format(self.recorded_at, self.online_count)
