from django.db import migrations


def migrate_membership_roles(apps, schema_editor):
    OrganizationRole = apps.get_model(
        'organizations',
        'OrganizationRole'
    )

    Membership = apps.get_model(
        'organizations',
        'Membership'
    )

    for membership in Membership.objects.all():

        role = OrganizationRole.objects.filter(
            name=membership.role
        ).first()

        if role:
            membership.role_fk_id = role.id
            membership.save(
                update_fields=['role_fk']
            )


def reverse_membership_roles(apps, schema_editor):
    Membership = apps.get_model(
        'organizations',
        'Membership'
    )

    for membership in Membership.objects.select_related(
        'role_fk'
    ).all():

        if membership.role_fk:
            membership.role = membership.role_fk.name
            membership.save(
                update_fields=['role']
            )


class Migration(migrations.Migration):

    dependencies = [
        (
            'organizations',
            '0009_migrate_membership_roles'
        ),
    ]

    operations = [
        migrations.RunPython(
            migrate_membership_roles,
            reverse_membership_roles
        ),
    ]
