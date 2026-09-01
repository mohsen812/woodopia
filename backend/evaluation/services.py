from tenders.models import Tender, Bid

from .engine import evaluate_bids


def evaluate_tender(tender_id):

    tender = Tender.objects.get(id=tender_id)

    bids = Bid.objects.filter(
        tender_round__tender=tender
    )

    results = evaluate_bids(
        bids
    )

    if not results:
        return {
            "tender_id": tender.id,
            "tender_title": tender.title,
            "summary": {
                "winner": None,
                "winner_score": None,
                "total_bids": 0,
            },
            "recommendation": {
                "type": "no_bids",
                "message": "No workshop bids submitted."
            },
            "results": [],
        }

    winner = results[0]

    score_gap = 0

    if len(results) > 1:
        score_gap = round(
            winner["total_score"]
            -
            results[1]["total_score"],
            2
        )


    if score_gap >= 5:

        recommendation_type = (
            "clear_winner"
        )

        message = (
            "One workshop has a clear advantage "
            "based on evaluation criteria."
        )

    else:

        recommendation_type = (
            "balanced_choice"
        )

        message = (
            "Competition is close. "
            "Customer should review price, "
            "time and warranty together."
        )


    return {

        "tender_id": tender.id,

        "tender_title": tender.title,


        "summary": {

            "winner": winner["workshop_name"],

            "winner_bid_id": winner["bid_id"],

            "winner_score": winner["total_score"],

            "total_bids": len(results),

            "score_gap": score_gap,

        },


        "recommendation": {

            "type": recommendation_type,

            "message": message,

        },


        "results": results,

    }
