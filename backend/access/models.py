from django.conf import settings
from django.db import models


class AccessRequest(models.Model):

    REQUEST_TYPES = [
        ("workshop", "Workshop"),
        ("consultant", "Consultant"),
        ("designer", "Designer"),
    ]


    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]


    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="access_requests",
    )


    requested_type = models.CharField(
        max_length=30,
        choices=REQUEST_TYPES,
    )


    organization_name = models.CharField(
        max_length=255,
        blank=True,
    )


    message = models.TextField(
        blank=True,
    )


    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
    )


    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_access_requests",
    )


    created_organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="access_requests",
    )


    created_membership = models.ForeignKey(
        "organizations.Membership",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="access_requests",
    )


    created_at = models.DateTimeField(
        auto_now_add=True,
    )


    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
    )


    class Meta:
        ordering = [
            "-created_at"
        ]


    def __str__(self):

        return (
            f"{self.user.username} - "
            f"{self.requested_type} - "
            f"{self.status}"
        )