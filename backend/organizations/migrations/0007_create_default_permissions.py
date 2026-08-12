from django.db import migrations


def create_default_permissions(apps, schema_editor):
    Permission = apps.get_model(
        'organizations',
        'Permission'
    )

    permissions = [
        (
            'view_organization',
            'View organization',
            'View organization information',
        ),
        (
            'manage_organization',
            'Manage organization',
            'Manage organization settings and information',
        ),
        (
            'view_members',
            'View members',
            'View organization members',
        ),
        (
            'manage_members',
            'Manage members',
            'Invite, remove, and manage organization members',
        ),
        (
            'view_projects',
            'View projects',
            'View organization projects',
        ),
        (
            'create_project',
            'Create project',
            'Create projects for the organization',
        ),
        (
            'manage_projects',
            'Manage projects',
            'Manage organization projects',
        ),
        (
            'view_tenders',
            'View tenders',
            'View tender information',
        ),
        (
            'manage_tenders',
            'Manage tenders',
            'Create and manage tenders',
        ),
        (
            'view_bids',
            'View bids',
            'View submitted bids',
        ),
        (
            'submit_bid',
            'Submit bid',
            'Submit bids for tenders',
        ),
        (
            'manage_production',
            'Manage production',
            'Manage production activities',
        ),
        (
            'view_production',
            'View production',
            'View production information',
        ),
        (
            'manage_qc',
            'Manage QC',
            'Manage quality control activities',
        ),
        (
            'view_qc',
            'View QC',
            'View quality control information',
        ),
        (
            'manage_design',
            'Manage design',
            'Manage design activities',
        ),
        (
            'view_design',
            'View design',
            'View design information',
        ),
        (
            'view_finance',
            'View finance',
            'View financial information',
        ),
        (
            'manage_finance',
            'Manage finance',
            'Manage financial information',
        ),
    ]

    for code, name, description in permissions:
        Permission.objects.get_or_create(
            code=code,
            defaults={
                'name': name,
                'description': description,
            }
        )


def remove_default_permissions(apps, schema_editor):
    Permission = apps.get_model(
        'organizations',
        'Permission'
    )

    codes = [
        'view_organization',
        'manage_organization',
        'view_members',
        'manage_members',
        'view_projects',
        'create_project',
        'manage_projects',
        'view_tenders',
        'manage_tenders',
        'view_bids',
        'submit_bid',
        'manage_production',
        'view_production',
        'manage_qc',
        'view_qc',
        'manage_design',
        'view_design',
        'view_finance',
        'manage_finance',
    ]

    Permission.objects.filter(
        code__in=codes
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        (
            'organizations',
            '0006_permission_rolepermission_and_more'
        ),
    ]

    operations = [
        migrations.RunPython(
            create_default_permissions,
            reverse_code=remove_default_permissions,
        ),
    ]
