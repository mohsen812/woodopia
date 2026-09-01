from decimal import Decimal
from types import SimpleNamespace

from django.test import SimpleTestCase

from .engine import (
    evaluate_bids,
    normalize_lower_is_better,
    normalize_higher_is_better,
)


class EvaluationEngineTests(SimpleTestCase):

    def create_bid(
        self,
        bid_id,
        workshop_id,
        workshop_name,
        total_amount,
        production_days,
        delivery_days,
        warranty_months,
    ):
        workshop = SimpleNamespace(
            id=workshop_id,
            name=workshop_name,
        )

        return SimpleNamespace(
            id=bid_id,
            workshop_id=workshop_id,
            workshop=workshop,
            total_amount=Decimal(str(total_amount)),
            production_days=production_days,
            delivery_days=delivery_days,
            warranty_months=warranty_months,
        )

    def test_normalize_lower_is_better(self):
        score = normalize_lower_is_better(
            Decimal("100"),
            Decimal("100"),
            Decimal("200"),
        )

        self.assertEqual(score, 1.0)

        score = normalize_lower_is_better(
            Decimal("200"),
            Decimal("100"),
            Decimal("200"),
        )

        self.assertEqual(score, 0.0)

    def test_normalize_higher_is_better(self):
        score = normalize_higher_is_better(
            100,
            100,
            200,
        )

        self.assertEqual(score, 0.0)

        score = normalize_higher_is_better(
            200,
            100,
            200,
        )

        self.assertEqual(score, 1.0)

    def test_single_bid_gets_full_score(self):
        bid = self.create_bid(
            bid_id=1,
            workshop_id=10,
            workshop_name="Workshop Alpha",
            total_amount=150000000,
            production_days=20,
            delivery_days=10,
            warranty_months=24,
        )

        results = evaluate_bids([bid])

        self.assertEqual(len(results), 1)

        result = results[0]

        self.assertEqual(result["bid_id"], 1)
        self.assertEqual(result["workshop_name"], "Workshop Alpha")
        self.assertEqual(result["amount"], Decimal("150000000"))

        self.assertEqual(result["price_score"], 100.0)
        self.assertEqual(result["production_score"], 100.0)
        self.assertEqual(result["delivery_score"], 100.0)
        self.assertEqual(result["warranty_score"], 100.0)

        self.assertEqual(result["total_score"], 100.0)
        self.assertEqual(result["rank"], 1)

    def test_three_bids_are_ranked_correctly(self):
        alpha = self.create_bid(
            bid_id=4,
            workshop_id=2,
            workshop_name="Workshop Alpha",
            total_amount=150000000,
            production_days=20,
            delivery_days=10,
            warranty_months=24,
        )

        beta = self.create_bid(
            bid_id=5,
            workshop_id=4,
            workshop_name="Workshop Beta",
            total_amount=130000000,
            production_days=35,
            delivery_days=20,
            warranty_months=12,
        )

        gamma = self.create_bid(
            bid_id=6,
            workshop_id=5,
            workshop_name="Workshop Gamma",
            total_amount=180000000,
            production_days=15,
            delivery_days=8,
            warranty_months=36,
        )

        results = evaluate_bids(
            [alpha, beta, gamma]
        )

        self.assertEqual(len(results), 3)

        self.assertEqual(
            results[0]["workshop_name"],
            "Workshop Alpha",
        )

        self.assertEqual(
            results[1]["workshop_name"],
            "Workshop Gamma",
        )

        self.assertEqual(
            results[2]["workshop_name"],
            "Workshop Beta",
        )

        self.assertEqual(
            results[0]["rank"],
            1,
        )

        self.assertEqual(
            results[1]["rank"],
            2,
        )

        self.assertEqual(
            results[2]["rank"],
            3,
        )

        self.assertEqual(
            results[0]["total_score"],
            64.83,
        )

        self.assertEqual(
            results[1]["total_score"],
            60.0,
        )

        self.assertEqual(
            results[2]["total_score"],
            40.0,
        )

    def test_equal_values_do_not_crash(self):
        bid_one = self.create_bid(
            bid_id=1,
            workshop_id=10,
            workshop_name="Workshop Alpha",
            total_amount=150000000,
            production_days=20,
            delivery_days=10,
            warranty_months=24,
        )

        bid_two = self.create_bid(
            bid_id=2,
            workshop_id=11,
            workshop_name="Workshop Beta",
            total_amount=150000000,
            production_days=20,
            delivery_days=10,
            warranty_months=24,
        )

        results = evaluate_bids(
            [bid_one, bid_two]
        )

        self.assertEqual(len(results), 2)

        for result in results:
            self.assertEqual(
                result["price_score"],
                100.0,
            )

            self.assertEqual(
                result["production_score"],
                100.0,
            )

            self.assertEqual(
                result["delivery_score"],
                100.0,
            )

            self.assertEqual(
                result["warranty_score"],
                100.0,
            )

            self.assertEqual(
                result["total_score"],
                100.0,
            )

    def test_empty_bids_return_empty_result(self):
        results = evaluate_bids([])

        self.assertEqual(
            results,
            [],
        )