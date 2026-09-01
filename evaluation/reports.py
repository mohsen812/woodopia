from .services import evaluate_tender


def build_tender_report(tender_id):

    evaluation = evaluate_tender(
        tender_id
    )

    if not evaluation["results"]:

        return {
            "tender_id": evaluation["tender_id"],
            "tender_title": evaluation["tender_title"],
            "decision": {
                "status": "no_bids",
                "message": "No workshop bids submitted.",
            },
            "ranking": [],
            "analysis": {},
            "recommendation": evaluation["recommendation"],
        }


    results = evaluation["results"]


    ranking = []

    for item in results:

        ranking.append(
            {
                "rank": item["rank"],
                "workshop": item["workshop_name"],
                "score": item["total_score"],
                "price": int(item["amount"]),
                "production_days": item["production_days"],
                "delivery_days": item["delivery_days"],
                "warranty_months": item["warranty_months"],
            }
        )


    best_price = min(
        results,
        key=lambda item: item["amount"]
    )

    fastest_delivery = min(
        results,
        key=lambda item: item["delivery_days"]
    )


    best_warranty = max(
        results,
        key=lambda item: item["warranty_months"]
    )


    winner = results[0]


    return {

        "tender_id": evaluation["tender_id"],

        "tender_title": evaluation["tender_title"],


        "decision": {

            "winner": winner["workshop_name"],

            "score": winner["total_score"],

            "confidence": (
                "high"
                if evaluation["summary"]["score_gap"] >= 10
                else "medium"
            ),

        },


        "ranking": ranking,


        "analysis": {

            "best_price": best_price["workshop_name"],

            "fastest_delivery": fastest_delivery["workshop_name"],

            "best_warranty": best_warranty["workshop_name"],

        },


        "recommendation": evaluation["recommendation"],

    }