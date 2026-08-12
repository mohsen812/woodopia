from django.db import migrations


def assign_default_role_permissions(apps, schema_editor):
    OrganizationRole = apps.get_model(
        'organizations',
        'OrganizationRole'
    )

    Permission = apps.get_model(
        'organizations',
        'Permission'
    )

    RolePermission = apps.get_model(
        'organizations',
        'RolePermission'
    )

    # Permission lookup
    permissions = {
        p.code: p
        for p in Permission.objects.all()
    }

    # Role lookup
    roles = {
        r.name: r
        for r in OrganizationRole.objects.all()
    }

    role_permissions = {

        'owner': [
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
        ],

        'manager': [
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
            'manage_production',
            'view_production',
            'view_qc',
            'view_design',
            'view_finance',
        ],

        'technical_manager': [
            'view_organization',
            'view_members',
            'view_projects',
            'manage_projects',
            'view_tenders',
            'view_bids',
            'manage_production',
            'view_production',
            'manage_qc',
            'view_qc',
        ],

        'production_manager': [
            'view_organization',
            'view_projects',
            'manage_projects',
            'view_production',
            'manage_production',
            'view_qc',
            'manage_qc',
        ],

        'qc': [
            'view_organization',
            'view_projects',
            'view_production',
            'view_qc',
            'manage_qc',
        ],

        'designer': [
            'view_organization',
            'view_projects',
            'create_project',
            'view_design',
            'manage_design',
        ],

        'consultant': [
            'view_organization',
            'view_projects',
            'create_project',
            'manage_projects',
            'view_design',
            'manage_design',
            'view_tenders',
        ],

        'member': [
            'view_organization',
            'view_members',
            'view_projects',
        ],
    }

    for role_name, permission_codes in role_permissions.items():

        role = roles.get(role_name)

        if not role:
            continue

        for permission_code in permission_codes:

            permission = permissions.get(permission_code)

            if not permission:
                continue

            RolePermission.objects.get_or_create(
                role=role,
                permission=permission,
            )


def remove_default_role_permissions(apps, schema_editor):
    OrganizationRole = apps.get_model(
        'organizations',
        'OrganizationRole'
    )

    RolePermission = apps.get_model(
        'organizations',
        'RolePermission'
    )

    role_names = [
        'owner',
        'manager',
        'technical_manager',
        'production_manager',
        'qc',
        'designer',
        'consultant',
        'member',
    ]

    roles = OrganizationRole.objects.filter(
        name__in=role_names
    )

    RolePermission.objects.filter(
        role__in=roles
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        (
            'organizations',
            '0007_create_default_permissions'
        ),
    ]

    operations = [
        migrations.RunPython(
            assign_default_role_permissions,
            reverse_code=remove_default_role_permissions,
        ),
    ]
