import secrets

from django.db import migrations


GREEK_PREFIXES = (
    "ALPHA", "BETA", "GAMMA", "DELTA", "EPSILON", "ZETA",
    "ETA", "THETA", "IOTA", "KAPPA", "LAMBDA", "MU", "NU",
    "XI", "OMICRON", "PI", "RHO", "SIGMA", "TAU", "UPSILON",
    "PHI", "CHI", "PSI", "OMEGA",
)


def backfill_bid_public_alias(apps, schema_editor):
    Bid = apps.get_model("tenders", "Bid")
    db_alias = schema_editor.connection.alias
    bids = (
        Bid.objects.using(db_alias)
        .filter(public_alias__isnull=True)
        .iterator()
    )

    for bid in bids:
        for _ in range(100):
            prefix = secrets.choice(GREEK_PREFIXES)
            code = secrets.token_hex(2).upper()
            candidate = f"{prefix}-{code}"

            exists = (
                Bid.objects.using(db_alias)
                .filter(public_alias=candidate)
                .exists()
            )

            if not exists:
                bid.public_alias = candidate
                bid.save(using=db_alias, update_fields=["public_alias"])
                break
        else:
            raise RuntimeError(
                "Could not allocate a unique bid alias after 100 attempts."
            )


class Migration(migrations.Migration):

    dependencies = [
        ("tenders", "0022_bid_public_alias"),
    ]

    operations = [
        migrations.RunPython(
            backfill_bid_public_alias,
            migrations.RunPython.noop,
        ),
    ]
