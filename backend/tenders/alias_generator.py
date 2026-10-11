
import secrets

from django.db import IntegrityError, transaction


GREEK_PREFIXES = (
    "ALPHA",
    "BETA",
    "GAMMA",
    "DELTA",
    "EPSILON",
    "ZETA",
    "ETA",
    "THETA",
    "IOTA",
    "KAPPA",
    "LAMBDA",
    "MU",
    "NU",
    "XI",
    "OMICRON",
    "PI",
    "RHO",
    "SIGMA",
    "TAU",
    "UPSILON",
    "PHI",
    "CHI",
    "PSI",
    "OMEGA",
)


def generate_alias_candidate():
    prefix = secrets.choice(GREEK_PREFIXES)
    code = secrets.token_hex(2).upper()
    return f"{prefix}-{code}"


def assign_bid_alias(bid):
    if bid.public_alias:
        return bid.public_alias

    from .models import Bid

    for _ in range(100):
        candidate = generate_alias_candidate()

        if Bid.objects.filter(public_alias=candidate).exists():
            continue

        try:
            # Savepoint allows a uniqueness collision to be retried
            # without breaking the surrounding submission transaction.
            with transaction.atomic():
                bid.public_alias = candidate
                bid.save(update_fields=["public_alias"])

            return candidate

        except IntegrityError:
            # Another concurrent submission may have claimed it.
            continue

    raise RuntimeError(
        "Could not allocate a unique bid alias after 100 attempts."
    )
