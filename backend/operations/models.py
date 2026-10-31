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


class WorkshopStatusLog(models.Model):
    """
    Audit trail for operational workshop status changes.
    """

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        related_name="operational_status_logs",
    )
    previous_status = models.CharField(max_length=50)
    new_status = models.CharField(max_length=50)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="workshop_status_changes",
    )
    reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Workshop status change"
        verbose_name_plural = "Workshop status changes"
        indexes = [
            models.Index(
                fields=["organization", "-created_at"],
                name="ops_ws_org_created_idx",
            ),
        ]

    def __str__(self):
        return (
            "{}: {} → {}".format(
                self.organization_id,
                self.previous_status,
                self.new_status,
            )
        )

class TenderAvailabilityLog(models.Model):
    """
    Audit trail for changes to a workshop's new-tender availability.
    This is independent of operational workshop status.
    """

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        related_name="tender_availability_logs",
    )
    previous_available = models.BooleanField()
    new_available = models.BooleanField()
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="workshop_tender_availability_changes",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Workshop tender availability change"
        verbose_name_plural = "Workshop tender availability changes"
        indexes = [
            models.Index(
                fields=["organization", "-created_at"],
                name="ops_ta_org_created_idx",
            ),
        ]

    def __str__(self):
        return "{}: {} → {}".format(
            self.organization_id,
            self.previous_available,
            self.new_available,
        )
