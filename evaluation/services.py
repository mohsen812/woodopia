from tenders.models import Tender, TenderRound, Bid

from .engine import evaluate_bids


def build_evaluation_result(
    results,
    context
):
    """
    Build common evaluation response structure.
    """

    if not results:
        return {
            **context,
            "summary": {
                "winner": None,
                "winner_bid_id": None,
                "winner_score": None,
                "total_bids": 0,
                "score_gap": 0,
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
        **context,

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



def evaluate_round(round_id):

    round_obj = TenderRound.objects.get(
        id=round_id
    )


    bids = Bid.objects.filter(
        tender_round=round_obj
    )


    results = evaluate_bids(
        bids
    )


    return build_evaluation_result(
        results,
        {
            "round_id": round_obj.id,
            "tender_id": round_obj.tender_id,
        }
    )



def get_active_evaluation_round(tender):

    evaluated_round = (
        tender.rounds
        .filter(
            status="evaluated"
        )
        .order_by(
            "-round_number"
        )
        .first()
    )


    if evaluated_round:
        return evaluated_round


    closed_round = (
        tender.rounds
        .filter(
            status="closed"
        )
        .order_by(
            "-round_number"
        )
        .first()
    )


    return closed_round



def evaluate_tender(tender_id):

    tender = Tender.objects.get(
        id=tender_id
    )


    active_round = get_active_evaluation_round(
        tender
    )


    if not active_round:

        return {
            "tender_id": tender.id,

            "tender_title": tender.title,

            "summary": {
                "winner": None,
                "winner_bid_id": None,
                "winner_score": None,
                "total_bids": 0,
                "score_gap": 0,
            },

            "recommendation": {
                "type": "no_round",
                "message": "No completed tender round available."
            },

            "results": [],
        }


    evaluation = evaluate_round(
        active_round.id
    )


    return {

        "tender_id": tender.id,

        "tender_title": tender.title,

        "round_id": active_round.id,

        "summary": evaluation["summary"],

        "recommendation": evaluation["recommendation"],

        "results": evaluation["results"],

    }