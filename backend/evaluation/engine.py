from decimal import Decimal

from .rules import (
    PRICE_WEIGHT,
    PRODUCTION_DAYS_WEIGHT,
    WARRANTY_MONTHS_WEIGHT,
    DELIVERY_DAYS_WEIGHT,
)


def normalize_lower_is_better(value, minimum, maximum):
    if value is None:
        return 0.0

    if maximum == minimum:
        return 1.0

    return float(
        (Decimal(str(maximum)) - Decimal(str(value)))
        / (Decimal(str(maximum)) - Decimal(str(minimum)))
    )


def normalize_higher_is_better(value, minimum, maximum):
    if value is None:
        return 0.0

    if maximum == minimum:
        return 1.0

    return float(
        (Decimal(str(value)) - Decimal(str(minimum)))
        / (Decimal(str(maximum)) - Decimal(str(minimum)))
    )


def evaluate_bids(bids):
    bids = list(bids)

    if not bids:
        return []

    valid_price = [
        bid.amount
        for bid in bids
        if bid.amount is not None
    ]

    valid_production = [
        bid.production_days
        for bid in bids
        if bid.production_days is not None
    ]

    valid_delivery = [
        bid.delivery_days
        for bid in bids
        if bid.delivery_days is not None
    ]

    valid_warranty = [
        bid.warranty_months
        for bid in bids
        if bid.warranty_months is not None
    ]

    results = []

    for bid in bids:
        price_score = normalize_lower_is_better(
            bid.amount,
            min(valid_price),
            max(valid_price),
        ) if valid_price else 0.0

        production_score = normalize_lower_is_better(
            bid.production_days,
            min(valid_production),
            max(valid_production),
        ) if valid_production else 0.0

        delivery_score = normalize_lower_is_better(
            bid.delivery_days,
            min(valid_delivery),
            max(valid_delivery),
        ) if valid_delivery else 0.0

        warranty_score = normalize_higher_is_better(
            bid.warranty_months,
            min(valid_warranty),
            max(valid_warranty),
        ) if valid_warranty else 0.0

        total_score = (
            price_score * PRICE_WEIGHT
            + production_score * PRODUCTION_DAYS_WEIGHT
            + warranty_score * WARRANTY_MONTHS_WEIGHT
            + delivery_score * DELIVERY_DAYS_WEIGHT
        )

        results.append({
            "bid_id": bid.id,
            "workshop_id": bid.workshop_id,
            "workshop_name": bid.workshop.name,
            "amount": bid.amount,
            "production_days": bid.production_days,
            "delivery_days": bid.delivery_days,
            "warranty_months": bid.warranty_months,
            "price_score": round(price_score * 100, 2),
            "production_score": round(production_score * 100, 2),
            "delivery_score": round(delivery_score * 100, 2),
            "warranty_score": round(warranty_score * 100, 2),
            "total_score": round(total_score * 100, 2),
        })

    results.sort(
        key=lambda result: result["total_score"],
        reverse=True,
    )

    for rank, result in enumerate(results, start=1):
        result["rank"] = rank

    return results
