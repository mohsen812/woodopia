from decimal import Decimal
from types import SimpleNamespace

from django.contrib.auth import get_user_model
from django.test import TestCase

from organizations.models import Organization
from projects.models import Project
from tenders.models import Tender, TenderRound, Bid

from .engine import (
    evaluate_bids,
    normalize_lower_is_better,
    normalize_higher_is_better,
)
from .services import evaluate_tender


class EvaluationEngineTests(TestCase):

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
        self.assertEqual(
            result["workshop_name"],
            "Workshop Alpha",
        )
        self.assertEqual(
            result["amount"],
            Decimal("150000000"),
        )

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
        self.assertEqual(
            result["rank"],
            1,
        )

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

        self.assertEqual(
            len(results),
            3,
        )

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

        self.assertEqual(
            len(results),
            2,
        )

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


class EvaluationServiceTests(TestCase):

    def setUp(self):
        User = get_user_model()

        self.user = User.objects.create_user(
            username="evaluation_test_user",
            email="evaluation@test.local",
            password="test-password",
        )

        self.customer = Organization.objects.create(
            name="Test Customer",
            organization_type="customer",
            owner=self.user,
        )

        self.project = Project.objects.create(
            title="Evaluation Test Project",
            description="Test project for tender evaluation.",
            customer=self.customer,
            created_by=self.user,
            status="tender",
        )

        self.tender = Tender.objects.create(
            project=self.project,
            title="Evaluation Test Tender",
            description="Test tender.",
            status="open",
        )

        self.round = TenderRound.objects.create(
            tender=self.tender,
            round_number=1,
            status="closed",
        )

    def create_workshop(self, name):
        return Organization.objects.create(
            name=name,
            organization_type="workshop",
            owner=self.user,
        )

    def create_bid(
        self,
        workshop,
        total_amount,
        production_days,
        delivery_days,
        warranty_months,
    ):
        return Bid.objects.create(
            tender_round=self.round,
            workshop=workshop,
            total_amount=total_amount,
            production_days=production_days,
            delivery_days=delivery_days,
            warranty_months=warranty_months,
        )

    def test_tender_without_bids_returns_no_bids(self):
        result = evaluate_tender(
            self.tender.id
        )

        self.assertEqual(
            result["tender_id"],
            self.tender.id,
        )

        self.assertEqual(
            result["tender_title"],
            "Evaluation Test Tender",
        )

        self.assertEqual(
            result["summary"]["total_bids"],
            0,
        )

        self.assertEqual(
            result["summary"]["winner"],
            None,
        )

        self.assertEqual(
            result["recommendation"]["type"],
            "no_bids",
        )

        self.assertEqual(
            result["results"],
            [],
        )

    def test_tender_selects_correct_winner(self):
        alpha = self.create_workshop(
            "Workshop Alpha"
        )

        beta = self.create_workshop(
            "Workshop Beta"
        )

        gamma = self.create_workshop(
            "Workshop Gamma"
        )

        self.create_bid(
            workshop=alpha,
            total_amount=150000000,
            production_days=20,
            delivery_days=10,
            warranty_months=24,
        )

        self.create_bid(
            workshop=beta,
            total_amount=130000000,
            production_days=35,
            delivery_days=20,
            warranty_months=12,
        )

        self.create_bid(
            workshop=gamma,
            total_amount=180000000,
            production_days=15,
            delivery_days=8,
            warranty_months=36,
        )

        result = evaluate_tender(
            self.tender.id
        )

        self.assertEqual(
            result["summary"]["total_bids"],
            3,
        )

        self.assertEqual(
            result["summary"]["winner"],
            "Workshop Alpha",
        )

        self.assertEqual(
            result["summary"]["winner_score"],
            64.83,
        )

        self.assertEqual(
            result["summary"]["score_gap"],
            4.83,
        )

        self.assertEqual(
            result["recommendation"]["type"],
            "balanced_choice",
        )

    def test_clear_winner_recommendation(self):
        winner = self.create_workshop(
            "Workshop Winner"
        )

        other = self.create_workshop(
            "Workshop Other"
        )

        self.create_bid(
            workshop=winner,
            total_amount=100000000,
            production_days=10,
            delivery_days=5,
            warranty_months=36,
        )

        self.create_bid(
            workshop=other,
            total_amount=200000000,
            production_days=30,
            delivery_days=20,
            warranty_months=12,
        )

        result = evaluate_tender(
            self.tender.id
        )

        self.assertEqual(
            result["summary"]["winner"],
            "Workshop Winner",
        )

        self.assertGreaterEqual(
            result["summary"]["score_gap"],
            5,
        )

        self.assertEqual(
            result["recommendation"]["type"],
            "clear_winner",
        )

    def test_balanced_choice_recommendation(self):
        alpha = self.create_workshop(
            "Workshop Alpha"
        )

        beta = self.create_workshop(
            "Workshop Beta"
        )

        self.create_bid(
            workshop=alpha,
            total_amount=150000000,
            production_days=20,
            delivery_days=10,
            warranty_months=24,
        )

        self.create_bid(
            workshop=beta,
            total_amount=150000000,
            production_days=20,
            delivery_days=10,
            warranty_months=24,
        )

        result = evaluate_tender(
            self.tender.id
        )

        self.assertLess(
            result["summary"]["score_gap"],
            5,
        )

        self.assertEqual(
            result["recommendation"]["type"],
            "balanced_choice",
        )
