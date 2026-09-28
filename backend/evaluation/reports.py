from .services import evaluate_tender


def build_tender_report(tender_id):

    evaluation = evaluate_tender(
        tender_id
    )

    results = evaluation.get(
        "results",
        []
    )

    if not results:

        return {
            "tender_id": evaluation.get(
                "tender_id"
            ),

            "tender_title": evaluation.get(
                "tender_title"
            ),

            "decision": {
                "winner": None,
                "score": None,
                "confidence": None,
                "status": "no_bids",
            },

            "ranking": [],

            "analysis": {},

            "recommendation": evaluation.get(
                "recommendation",
                {
                    "type": "no_bids",
                    "message": "No workshop bids submitted."
                }
            ),
        }


    ranking = []

    for item in results:

        ranking.append(
            {
                "rank": item["rank"],

                "workshop": item["workshop_name"],

                "score": item["total_score"],

                "price": int(
                    item["amount"]
                ),

                "production_days": item[
                    "production_days"
                ],

                "delivery_days": item[
                    "delivery_days"
                ],

                "warranty_months": item[
                    "warranty_months"
                ],
            }
        )


    best_price = min(
        results,
        key=lambda item: item["amount"]
    )


    fastest_delivery = min(
        results,
        key=lambda item: (
            item["delivery_days"]
            if item["delivery_days"] is not None
            else 999999
        )
    )


    best_warranty = max(
        results,
        key=lambda item: (
            item["warranty_months"]
            if item["warranty_months"] is not None
            else 0
        )
    )


    winner = results[0]


    score_gap = evaluation.get(
        "summary",
        {}
    ).get(
        "score_gap",
        0
    )


    return {

        "tender_id": evaluation["tender_id"],

        "tender_title": evaluation["tender_title"],


        "decision": {

            "winner": winner["workshop_name"],

            "score": winner["total_score"],

            "confidence": (
                "high"
                if score_gap >= 10
                else "medium"
            ),

            "status": "evaluated",

        },


        "ranking": ranking,


        "analysis": {

            "best_price": best_price["workshop_name"],

            "fastest_delivery": fastest_delivery["workshop_name"],

            "best_warranty": best_warranty["workshop_name"],

        },


        "recommendation": evaluation.get(
            "recommendation",
            {
                "type": "balanced_choice",
                "message": (
                    "Customer should review "
                    "price, time and warranty."
                ),
            }
        ),

    }