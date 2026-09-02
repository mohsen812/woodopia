from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework.test import APIClient

from organizations.models import Organization
from projects.models import Project
from .models import (
    Tender,
    TenderRound,
    Bid,
    TenderAward,
)


class TenderReportAPITests(TestCase):

    def setUp(self):
        User = get_user_model()

        self.user = User.objects.create_user(
            username="tender_report_test_user",
            email="tender-report@test.local",
            password="test-password",
        )

        self.customer = Organization.objects.create(
            name="Test Customer",
            organization_type="customer",
            owner=self.user,
        )

        self.alpha = Organization.objects.create(
            name="Workshop Alpha",
            organization_type="workshop",
            owner=self.user,
        )

        self.beta = Organization.objects.create(
            name="Workshop Beta",
            organization_type="workshop",
            owner=self.user,
        )

        self.project = Project.objects.create(
            title="Tender Report Test Project",
            description="Test project for tender report API.",
            customer=self.customer,
            created_by=self.user,
            status="tender",
        )

        self.tender = Tender.objects.create(
            project=self.project,
            title="Tender Report Test Tender",
            description="Test tender report.",
            status="open",
        )

        self.round = TenderRound.objects.create(
            tender=self.tender,
            round_number=1,
            status="closed",
        )

        self.client = APIClient()

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

    def test_report_endpoint_returns_200(self):
        self.create_bid(
            workshop=self.alpha,
            total_amount=150000000,
            production_days=20,
            delivery_days=10,
            warranty_months=24,
        )

        response = self.client.get(
            "/api/tenders/{}/report/".format(
                self.tender.id
            )
        )

        self.assertEqual(
            response.status_code,
            200,
        )

    def test_report_contains_decision(self):
        self.create_bid(
            workshop=self.alpha,
            total_amount=150000000,
            production_days=20,
            delivery_days=10,
            warranty_months=24,
        )

        response = self.client.get(
            "/api/tenders/{}/report/".format(
                self.tender.id
            )
        )

        data = response.json()

        self.assertIn(
            "decision",
            data,
        )

        self.assertEqual(
            data["decision"]["winner"],
            "Workshop Alpha",
        )

        self.assertEqual(
            data["decision"]["score"],
            100.0,
        )

    def test_report_contains_ranking(self):
        self.create_bid(
            workshop=self.alpha,
            total_amount=150000000,
            production_days=20,
            delivery_days=10,
            warranty_months=24,
        )

        self.create_bid(
            workshop=self.beta,
            total_amount=180000000,
            production_days=15,
            delivery_days=8,
            warranty_months=36,
        )

        response = self.client.get(
            "/api/tenders/{}/report/".format(
                self.tender.id
            )
        )

        data = response.json()

        self.assertIn(
            "ranking",
            data,
        )

        self.assertEqual(
            len(data["ranking"]),
            2,
        )

        self.assertEqual(
            data["ranking"][0]["rank"],
            1,
        )

        self.assertEqual(
            data["ranking"][1]["rank"],
            2,
        )

    def test_report_contains_analysis(self):
        self.create_bid(
            workshop=self.alpha,
            total_amount=150000000,
            production_days=20,
            delivery_days=10,
            warranty_months=24,
        )

        self.create_bid(
            workshop=self.beta,
            total_amount=180000000,
            production_days=15,
            delivery_days=8,
            warranty_months=36,
        )

        response = self.client.get(
            "/api/tenders/{}/report/".format(
                self.tender.id
            )
        )

        data = response.json()

        self.assertIn(
            "analysis",
            data,
        )

        self.assertIn(
            "best_price",
            data["analysis"],
        )

        self.assertIn(
            "fastest_delivery",
            data["analysis"],
        )

        self.assertIn(
            "best_warranty",
            data["analysis"],
        )

        self.assertEqual(
            data["analysis"]["best_price"],
            "Workshop Alpha",
        )

        self.assertEqual(
            data["analysis"]["fastest_delivery"],
            "Workshop Beta",
        )

        self.assertEqual(
            data["analysis"]["best_warranty"],
            "Workshop Beta",
        )

    def test_report_without_bids(self):
        response = self.client.get(
            "/api/tenders/{}/report/".format(
                self.tender.id
            )
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        data = response.json()

        self.assertEqual(
            data["decision"]["winner"],
            None,
        )

        self.assertEqual(
            data["ranking"],
            [],
        )

        self.assertEqual(
            data["recommendation"]["type"],
            "no_bids",
        )

    def test_report_for_invalid_tender_returns_404(self):
        response = self.client.get(
            "/api/tenders/999999/report/"
        )

        self.assertEqual(
            response.status_code,
            404,
        )
class TenderAwardModelTests(TestCase):

    def setUp(self):
        User = get_user_model()

        self.user = User.objects.create_user(
            username="award_test_user",
            email="award-test@test.local",
            password="test-password",
        )

        self.customer = Organization.objects.create(
            name="Award Test Customer",
            organization_type="customer",
            owner=self.user,
        )

        self.workshop = Organization.objects.create(
            name="Award Test Workshop",
            organization_type="workshop",
            owner=self.user,
        )

        self.project = Project.objects.create(
            title="Award Test Project",
            description="Project for award model tests.",
            customer=self.customer,
            created_by=self.user,
            status="tender",
        )

        self.tender = Tender.objects.create(
            project=self.project,
            title="Award Test Tender",
            description="Tender for award model tests.",
            status="open",
        )

        self.round = TenderRound.objects.create(
            tender=self.tender,
            round_number=1,
            status="closed",
        )

        self.bid = Bid.objects.create(
            tender_round=self.round,
            workshop=self.workshop,
            total_amount=150000000,
            production_days=20,
            delivery_days=10,
            warranty_months=24,
        )

    def test_award_can_be_created(self):

        award = TenderAward.objects.create(
            tender=self.tender,
            bid=self.bid,
            awarded_by=self.user,
        )

        self.assertEqual(
            award.tender,
            self.tender,
        )

        self.assertEqual(
            award.bid,
            self.bid,
        )

        self.assertEqual(
            award.awarded_by,
            self.user,
        )

        self.assertEqual(
            award.bid.workshop,
            self.workshop,
        )

    def test_tender_can_have_only_one_award(self):

        TenderAward.objects.create(
            tender=self.tender,
            bid=self.bid,
            awarded_by=self.user,
        )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                TenderAward.objects.create(
                    tender=self.tender,
                    bid=self.bid,
                    awarded_by=self.user,
                )
