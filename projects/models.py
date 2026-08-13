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



class SubProjectType(models.Model):

    name = models.CharField(
        max_length=100,
        unique=True
    )

    code = models.CharField(
        max_length=50,
        unique=True
    )

    description = models.TextField(
        blank=True
    )


    def __str__(self):
        return self.name



class SubProject(models.Model):

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('tender', 'Tender'),
        ('selected', 'Workshop Selected'),
        ('production', 'Production'),
        ('qc', 'Quality Control'),
        ('completed', 'Completed'),
        ('blocked', 'Blocked'),
        ('cancelled', 'Cancelled'),
    ]


    project_item = models.ForeignKey(
        ProjectItem,
        on_delete=models.CASCADE,
        related_name='subprojects'
    )


    name = models.CharField(
        max_length=255
    )


    description = models.TextField(
        blank=True
    )


    subproject_type = models.ForeignKey(
        SubProjectType,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='subprojects'
    )


    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default='draft'
    )


    assigned_organization = models.ForeignKey(
        Organization,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_subprojects'
    )


    quantity = models.PositiveIntegerField(
        default=1
    )


    created_at = models.DateTimeField(
        auto_now_add=True
    )


    updated_at = models.DateTimeField(
        auto_now=True
    )


    def __str__(self):
        return self.name




class SubProjectDependency(models.Model):


    DEPENDENCY_TYPES = [

        ('requires', 'Requires'),
        ('blocks', 'Blocks'),
        ('influences', 'Influences'),
        ('optional', 'Optional'),
        ('parallel', 'Parallel'),

    ]


    STATUS_CHOICES = [

        ('active', 'Active'),
        ('completed', 'Completed'),
        ('blocked', 'Blocked'),

    ]


    from_subproject = models.ForeignKey(
        SubProject,
        on_delete=models.CASCADE,
        related_name='outgoing_dependencies'
    )


    to_subproject = models.ForeignKey(
        SubProject,
        on_delete=models.CASCADE,
        related_name='incoming_dependencies'
    )


    dependency_type = models.CharField(
        max_length=50,
        choices=DEPENDENCY_TYPES,
        default='requires'
    )


    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default='active'
    )


    delay_days = models.PositiveIntegerField(
        default=0
    )


    is_blocking = models.BooleanField(
        default=False
    )


    created_at = models.DateTimeField(
        auto_now_add=True
    )


    class Meta:

        constraints = [

            models.UniqueConstraint(
                fields=[
                    'from_subproject',
                    'to_subproject'
                ],
                name='unique_subproject_dependency'
            )

        ]


    def __str__(self):

        return (
            f"{self.from_subproject.name} -> "
            f"{self.to_subproject.name}"
        )

class ProjectZone(models.Model):

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="zones",
        null=True,
        blank=True
    )

    name = models.CharField(
        max_length=100
    )

    code = models.CharField(
        max_length=50
    )

    description = models.TextField(
        blank=True
    )

    x_position = models.IntegerField(
        default=0
    )

    y_position = models.IntegerField(
        default=0
    )

    order = models.PositiveIntegerField(
        default=0
    )

    is_active = models.BooleanField(
        default=True
    )


    class Meta:
        ordering = [
            "order",
            "id"
        ]


    def __str__(self):
        if self.project:
            return f"{self.project.title} - {self.name}"
        return self.name

class ProjectToken(models.Model):

    STATUS_CHOICES = [

        ('active', 'Active'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),

    ]


    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='tokens'
    )


    current_subproject = models.ForeignKey(
        SubProject,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tokens'
    )


    current_zone = models.ForeignKey(
        ProjectZone,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tokens'
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
        default='active'
    )


    position_x = models.FloatField(
        default=0
    )


    position_y = models.FloatField(
        default=0
    )


    created_at = models.DateTimeField(
        auto_now_add=True
    )


    updated_at = models.DateTimeField(
        auto_now=True
    )


    def __str__(self):
        return self.title
