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
    estimated_budget = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True
    )

    required_delivery_days = models.PositiveIntegerField(
        null=True,
        blank=True
    )

    location = models.CharField(
        max_length=255,
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

class ProjectAttachment(models.Model):

    TYPE_CHOICES = [
        ('image', 'Image'),
        ('document', 'Document'),
        ('design', 'Design'),
        ('other', 'Other'),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='attachments'
    )

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    file = models.FileField(
        upload_to='projects/%Y/%m/'
    )

    file_type = models.CharField(
        max_length=30,
        choices=TYPE_CHOICES,
        default='other'
    )

    title = models.CharField(
        max_length=255,
        blank=True
    )

    description = models.TextField(
        blank=True
    )

    version = models.PositiveIntegerField(
        default=1
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )


    def __str__(self):
        return self.title or self.file.name

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
class ProjectRoad(models.Model):

    name = models.CharField(
        max_length=100
    )

    from_zone = models.ForeignKey(
        ProjectZone,
        on_delete=models.CASCADE,
        related_name="outgoing_roads"
    )

    to_zone = models.ForeignKey(
        ProjectZone,
        on_delete=models.CASCADE,
        related_name="incoming_roads"
    )

    direction = models.CharField(
        max_length=50,
        default="forward"
    )

    speed = models.FloatField(
        default=1.0
    )

    is_active = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )


    def __str__(self):
        return self.name

class ProjectMovement(models.Model):

    ACTION_CHOICES = [

        ("created", "Created"),
        ("moved", "Moved"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("assigned", "Assigned"),
        ("completed", "Completed"),

    ]


    token = models.ForeignKey(
        ProjectToken,
        on_delete=models.CASCADE,
        related_name="movements"
    )


    from_zone = models.ForeignKey(
        ProjectZone,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="movement_from"
    )


    to_zone = models.ForeignKey(
        ProjectZone,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="movement_to"
    )


    action = models.CharField(
        max_length=50,
        choices=ACTION_CHOICES,
        default="moved"
    )


    note = models.TextField(
        blank=True
    )


    created_at = models.DateTimeField(
        auto_now_add=True
    )


    def __str__(self):
        return f"{self.token.title} - {self.action}"
    
class ProjectVisual(models.Model):

    SHAPE_TYPES = [

        ('triangle', 'Triangle'),
        ('square', 'Square'),
        ('pentagon', 'Pentagon'),
        ('hexagon', 'Hexagon'),
        ('polygon', 'Polygon'),

    ]


    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='visuals'
    )


    name = models.CharField(
        max_length=100
    )


    shape_type = models.CharField(
        max_length=50,
        choices=SHAPE_TYPES,
        default='triangle'
    )


    color = models.CharField(
        max_length=50,
        default='blue'
    )


    size = models.PositiveIntegerField(
        default=1
    )


    rotation = models.IntegerField(
        default=0
    )


    # برای تنظیمات پیشرفته گرافیکی آینده
    visual_data = models.JSONField(
        default=dict,
        blank=True
    )


    # وضعیت زنده بودن آبجکت
    STATUS_CHOICES = [

        ('waiting', 'Waiting'),
        ('active', 'Active'),
        ('moving', 'Moving'),
        ('completed', 'Completed'),
        ('blocked', 'Blocked'),

    ]


    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default='waiting'
    )


    current_zone = models.ForeignKey(
        ProjectZone,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="visual_objects"
    )


    position_x = models.FloatField(
        default=0
    )


    position_y = models.FloatField(
        default=0
    )


    is_active = models.BooleanField(
        default=True
    )


    created_at = models.DateTimeField(
        auto_now_add=True
    )


    updated_at = models.DateTimeField(
        auto_now=True
    )


    def __str__(self):

        return f"{self.project.title} - {self.name}"
