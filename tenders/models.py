from django.db import models
from projects.models import ProjectItem
from organizations.models import Organization


class Tender(models.Model):

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('open', 'Open'),
        ('closed', 'Closed'),
        ('awarded', 'Awarded'),
        ('cancelled', 'Cancelled'),
    ]

    project_item = models.ForeignKey(
        ProjectItem,
        on_delete=models.CASCADE,
        related_name='tenders'
    )

    title = models.CharField(
        max_length=255
    )

    description = models.TextField(
        blank=True
    )

    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default='draft'
    )

    deadline = models.DateTimeField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )


    def __str__(self):
        return self.title



class TenderParticipant(models.Model):

    tender = models.ForeignKey(
        Tender,
        on_delete=models.CASCADE,
        related_name='participants'
    )

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE
    )

    invited_at = models.DateTimeField(
        auto_now_add=True
    )



class Bid(models.Model):

    tender = models.ForeignKey(
        Tender,
        on_delete=models.CASCADE,
        related_name='bids'
    )

    workshop = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=0
    )

    description = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )


    def __str__(self):
        return f"{self.workshop.name} - {self.amount}"
