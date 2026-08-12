from django.db import models
from django.conf import settings


class Organization(models.Model):

    ORGANIZATION_TYPES = [
        ('customer', 'Customer'),
        ('workshop', 'Workshop'),
        ('designer', 'Designer'),
        ('company', 'Company'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('rejected', 'Rejected'),
    ]

    name = models.CharField(max_length=255)

    organization_type = models.CharField(
        max_length=50,
        choices=ORGANIZATION_TYPES
    )

    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default='active'
    )

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='owned_organizations'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.name


class OrganizationRole(models.Model):

    ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('manager', 'Manager'),
        ('technical_manager', 'Technical Manager'),
        ('production_manager', 'Production Manager'),
        ('qc', 'QC'),
        ('designer', 'Designer'),
        ('consultant', 'Consultant'),
        ('member', 'Member'),
    ]

    name = models.CharField(
        max_length=50,
        choices=ROLE_CHOICES
    )

    organization_type = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )

    description = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.name


class Permission(models.Model):

    code = models.CharField(
        max_length=100,
        unique=True
    )

    name = models.CharField(
        max_length=255
    )

    description = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.name


class RolePermission(models.Model):

    role = models.ForeignKey(
        OrganizationRole,
        on_delete=models.CASCADE,
        related_name='role_permissions'
    )

    permission = models.ForeignKey(
        Permission,
        on_delete=models.CASCADE,
        related_name='role_permissions'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['role', 'permission'],
                name='unique_role_permission'
            )
        ]

    def __str__(self):
        return f"{self.role.name} - {self.permission.code}"


class Membership(models.Model):

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('invited', 'Invited'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='memberships'
    )

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='members'
    )

    # Temporary field.
    # Existing data will be migrated to role_fk.
    role = models.CharField(
        max_length=50,
        choices=[
            ('owner', 'Owner'),
            ('manager', 'Manager'),
            ('member', 'Member'),
        ],
        default='member'
    )

    role_fk = models.ForeignKey(
        OrganizationRole,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='memberships'
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active'
    )

    joined_at = models.DateTimeField(
        auto_now_add=True
    )

    ended_at = models.DateTimeField(
        null=True,
        blank=True
    )

    def __str__(self):
        role_name = (
            self.role_fk.name
            if self.role_fk
            else self.role
        )

        return (
            f"{self.user.email} - "
            f"{self.organization.name} - "
            f"{role_name}"
        )


class OrganizationApplication(models.Model):

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('edit_required', 'Edit Required'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    applicant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='organization_applications'
    )

    requested_type = models.CharField(
        max_length=50,
        choices=Organization.ORGANIZATION_TYPES
    )

    organization_name = models.CharField(
        max_length=255
    )

    description = models.TextField(
        blank=True
    )

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default='pending'
    )

    review_comment = models.TextField(
        blank=True
    )

    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_organization_applications'
    )

    reviewed_at = models.DateTimeField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"{self.organization_name} - {self.status}"


class OrganizationReviewLog(models.Model):

    ACTION_CHOICES = [
        ('submitted', 'Submitted'),
        ('edit_required', 'Edit Required'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    application = models.ForeignKey(
        OrganizationApplication,
        on_delete=models.CASCADE,
        related_name='review_logs'
    )

    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='organization_review_logs'
    )

    action = models.CharField(
        max_length=30,
        choices=ACTION_CHOICES
    )

    comment = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return (
            f"{self.application.organization_name} - "
            f"{self.action}"
        )
