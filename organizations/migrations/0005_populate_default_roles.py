from django.db import migrations


def create_roles(apps, schema_editor):
    OrganizationRole = apps.get_model(
        'organizations',
        'OrganizationRole'
    )

    roles = [
        ('owner', None, 'Organization owner'),
        ('manager', None, 'Organization manager'),
        ('technical_manager', 'workshop', 'Technical manager'),
        ('production_manager', 'workshop', 'Production manager'),
        ('qc', 'workshop', 'Quality control'),
        ('designer', 'designer', 'Designer'),
        ('consultant', None, 'Project consultant'),
        ('member', None, 'General member'),
    ]

    for name, organization_type, description in roles:
        OrganizationRole.objects.get_or_create(
            name=name,
            organization_type=organization_type,
            defaults={
                'description': description
            }
        )


def remove_roles(apps, schema_editor):
    OrganizationRole = apps.get_model(
        'organizations',
        'OrganizationRole'
    )

    OrganizationRole.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        (
            'organizations',
            '0004_create_default_roles'
        ),
    ]

    operations = [
        migrations.RunPython(
            create_roles,
            reverse_code=remove_roles
        ),
    ]
