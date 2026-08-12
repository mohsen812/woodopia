from django.db import models
from django.conf import settings
from organizations.models import Organization


class Project(models.Model):

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('consulting', 'Consulting'),
        ('tender', 'Tender'),
        ('production', 'Production'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    title = models.CharField(
        max_length=255
    )

    description = models.TextField(
        blank=True
    )

    customer = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='customer_projects'
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_projects'
    )

    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default='draft'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )


    def __str__(self):
        return self.title

class ProjectItem(models.Model):

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('selected', 'Selected'),
        ('production', 'Production'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='items'
    )

    name = models.CharField(
        max_length=255
    )

    description = models.TextField(
        blank=True
    )

    quantity = models.PositiveIntegerField(
        default=1
    )

    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default='active'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.name
