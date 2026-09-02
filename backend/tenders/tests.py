from django.utils import timezone
from datetime import timedelta

from .visibility import tender_is_revealed

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework.test import APIClient

from organizations.models import Organization
from projects.models import Project

from datetime import timedelta
from django.utils import timezone

from .models import (
    Tender,
    TenderRound,
    Bid,
    TenderAward,
)
from .services import get_visible_bids
from .services import award_tender

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
            reveal_at=timezone.now() - timedelta(minutes=1),
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
class TenderAwardServiceTests(TestCase):

    def setUp(self):
        User = get_user_model()

        self.user = User.objects.create_user(
            username="award_service_user",
            email="award-service@test.local",
            password="test-password",
        )

        self.customer = Organization.objects.create(
            name="Award Customer",
            organization_type="customer",
            owner=self.user,
        )

        self.workshop = Organization.objects.create(
            name="Workshop Award",
            organization_type="workshop",
            owner=self.user,
        )

        self.project = Project.objects.create(
            title="Award Project",
            customer=self.customer,
        )

        self.tender = Tender.objects.create(
            project=self.project,
            title="Award Tender",
            status="closed",
        )

        self.round = TenderRound.objects.create(
            tender=self.tender,
            round_number=1,
            status="closed",
        )

        self.bid = Bid.objects.create(
            tender_round=self.round,
            workshop=self.workshop,
            total_amount=100000000,
            production_days=10,
            delivery_days=5,
            warranty_months=24,
        )


    def test_award_creates_award_and_updates_tender(self):

        award = award_tender(
            self.tender.id,
            self.bid.id,
            self.user,
        )

        self.assertEqual(
            award.tender,
            self.tender,
        )

        self.assertEqual(
            award.bid,
            self.bid,
        )

        self.tender.refresh_from_db()

        self.assertEqual(
            self.tender.status,
            "awarded",
        )
class TenderVisibilityTests(TestCase):

    def setUp(self):
        User = get_user_model()

        self.user = User.objects.create_user(
            username="visibility_user",
            email="visibility@test.local",
            password="test-password",
        )

        self.customer = Organization.objects.create(
            name="Visibility Customer",
            organization_type="customer",
            owner=self.user,
        )

        self.project = Project.objects.create(
            title="Visibility Project",
            customer=self.customer,
        )

        self.tender = Tender.objects.create(
            project=self.project,
            title="Visibility Tender",
            status="closed",
        )


    def test_tender_not_revealed_before_reveal_time(self):

        self.tender.reveal_at = (
            timezone.now()
            +
            timedelta(hours=2)
        )

        self.tender.save()

        self.assertFalse(
            tender_is_revealed(
                self.tender
            )
        )


    def test_tender_revealed_after_reveal_time(self):

        self.tender.reveal_at = (
            timezone.now()
            -
            timedelta(hours=1)
        )

        self.tender.save()

        self.assertTrue(
            tender_is_revealed(
                self.tender
            )
        )

class TenderRevealLockAPITests(TestCase):

    def setUp(self):
        User = get_user_model()

        self.user = User.objects.create_user(
            username="reveal_lock_user",
            email="reveal-lock@test.local",
            password="test-password",
        )

        self.customer = Organization.objects.create(
            name="Reveal Lock Customer",
            organization_type="customer",
            owner=self.user,
        )

        self.project = Project.objects.create(
            title="Reveal Lock Project",
            description="Reveal lock test project.",
            customer=self.customer,
            created_by=self.user,
            status="tender",
        )

        self.tender = Tender.objects.create(
            project=self.project,
            title="Locked Tender",
            description="Should not be visible before reveal.",
            status="open",
            reveal_at=timezone.now() + timedelta(hours=2),
        )

        self.client = APIClient()


    def test_report_is_locked_before_reveal(self):

        response = self.client.get(
            "/api/tenders/{}/report/".format(
                self.tender.id
            )
        )

        self.assertEqual(
            response.status_code,
            403,
        )

        data = response.json()

        self.assertEqual(
            data["status"],
            "locked",
        )
class TenderBidVisibilityTests(TestCase):

    def setUp(self):

        User = get_user_model()

        self.user = User.objects.create_user(
            username="visibility_test_user",
            email="visibility@test.local",
            password="test-password",
        )

        self.customer = Organization.objects.create(
            name="Visibility Customer",
            organization_type="customer",
            owner=self.user,
        )

        self.workshop1 = Organization.objects.create(
            name="Workshop One",
            organization_type="workshop",
            owner=self.user,
        )

        self.workshop2 = Organization.objects.create(
            name="Workshop Two",
            organization_type="workshop",
            owner=self.user,
        )

        self.project = Project.objects.create(
            title="Visibility Test Project",
            description="Bid visibility test.",
            customer=self.customer,
            created_by=self.user,
            status="tender",
        )

        self.tender = Tender.objects.create(
            project=self.project,
            title="Visibility Tender",
            status="open",
            reveal_at=timezone.now() + timedelta(hours=1),
        )

        self.round = TenderRound.objects.create(
            tender=self.tender,
            round_number=1,
            status="closed",
        )

        self.bid1 = Bid.objects.create(
            tender_round=self.round,
            workshop=self.workshop1,
            total_amount=1000000,
        )

        self.bid2 = Bid.objects.create(
            tender_round=self.round,
            workshop=self.workshop2,
            total_amount=900000,
        )


    def test_bids_are_hidden_before_reveal(self):

        with self.assertRaises(ValueError):

            get_visible_bids(
                self.tender,
                "customer",
            )


    def test_workshop_can_only_see_own_bid_after_reveal(self):

        self.tender.reveal_at = timezone.now()
        self.tender.save()

        bids = get_visible_bids(
            self.tender,
            "workshop",
            self.workshop1,
        )

        self.assertEqual(
            bids.count(),
            1,
        )

        self.assertEqual(
            bids.first(),
            self.bid1,
        )
class TenderVisibleBidsTests(TestCase):

    def setUp(self):

        User = get_user_model()

        self.user = User.objects.create_user(
            username="visible_bid_user",
            email="visible-bid@test.local",
            password="test-password",
        )

        self.customer = Organization.objects.create(
            name="Visible Customer",
            organization_type="customer",
            owner=self.user,
        )

        self.workshops = []

        for index in range(7):

            self.workshops.append(
                Organization.objects.create(
                    name=f"Workshop {index}",
                    organization_type="workshop",
                    owner=self.user,
                )
            )


        self.project = Project.objects.create(
            title="Visible Bid Project",
            customer=self.customer,
            created_by=self.user,
            status="tender",
        )


        self.tender = Tender.objects.create(
            project=self.project,
            title="Visible Bid Tender",
            status="open",
            reveal_at=timezone.now() - timedelta(hours=1),
        )


        self.round = TenderRound.objects.create(
            tender=self.tender,
            round_number=1,
            status="closed",
        )


        self.bids = []

        for index, workshop in enumerate(self.workshops):

            self.bids.append(
                Bid.objects.create(
                    tender_round=self.round,
                    workshop=workshop,
                    total_amount=1000000 - (index * 10000),
                    production_days=10,
                    delivery_days=5,
                    warranty_months=12,
                )
            )


    def test_customer_only_sees_top_three_bids(self):

        bids = get_visible_bids(
            self.tender,
            "customer",
        )

        self.assertEqual(
            bids.count(),
            3,
        )


    def test_consultant_sees_all_bids(self):

        bids = get_visible_bids(
            self.tender,
            "consultant",
        )

        self.assertEqual(
            bids.count(),
            7,
        )


    def test_workshop_only_sees_own_bid(self):

        bids = get_visible_bids(
            self.tender,
            "workshop",
            self.workshops[0],
        )

        self.assertEqual(
            bids.count(),
            1,
        )

        self.assertEqual(
            bids.first().workshop,
            self.workshops[0],
        )
class TenderVisibleBidsAPITests(TestCase):

    def setUp(self):

        User = get_user_model()

        self.user = User.objects.create_user(
            username="visible_api_user",
            email="visible-api@test.local",
            password="test-password",
        )

        self.customer = Organization.objects.create(
            name="API Customer",
            organization_type="customer",
            owner=self.user,
        )

        self.workshops = []

        for index in range(7):
            self.workshops.append(
                Organization.objects.create(
                    name=f"API Workshop {index}",
                    organization_type="workshop",
                    owner=self.user,
                )
            )


        self.project = Project.objects.create(
            title="Visible API Project",
            customer=self.customer,
            created_by=self.user,
            status="tender",
        )


        self.tender = Tender.objects.create(
            project=self.project,
            title="Visible API Tender",
            status="open",
            reveal_at=timezone.now() - timedelta(hours=1),
        )


        self.round = TenderRound.objects.create(
            tender=self.tender,
            round_number=1,
            status="closed",
        )


        for index, workshop in enumerate(self.workshops):

            Bid.objects.create(
                tender_round=self.round,
                workshop=workshop,
                total_amount=1000000 - index * 10000,
                production_days=10,
                delivery_days=5,
                warranty_months=12,
            )


        self.client = APIClient()


    def test_customer_visible_bids_api_returns_three(self):

        response = self.client.get(
            "/api/tenders/{}/visible-bids/?viewer_type=customer".format(
                self.tender.id
            )
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            len(response.json()),
            3,
        )


    def test_consultant_visible_bids_api_returns_all(self):

        response = self.client.get(
            "/api/tenders/{}/visible-bids/?viewer_type=consultant".format(
                self.tender.id
            )
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            len(response.json()),
            7,
        )
