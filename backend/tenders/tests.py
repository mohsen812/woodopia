from decimal import Decimal
from django.utils import timezone
from datetime import timedelta

from .visibility import tender_is_revealed

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework.test import APIClient

from organizations.models import (
    Organization,
    Membership,
    OrganizationRole,
)
from projects.models import (
    Project,
    ProjectItem,
    ProjectAssignment,
)

from datetime import timedelta
from django.utils import timezone
from .workflows import reveal_tender
from .models import (
    Tender,
    TenderRound,
    Bid,
    BidItem,
    TenderAward,
    CustomerTenderSelection,
    TenderParticipant,
	PaymentSchedule,

)
from .services import get_visible_bids
from .services import (
    award_tender,
    select_tender_bid,
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
			status="submitted",
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
            status="revealed",
            revealed_at=timezone.now(),
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
			status="submitted",
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
class CustomerTenderSelectionServiceTests(TestCase):

    def setUp(self):
        User = get_user_model()

        self.user = User.objects.create_user(
            username="selection_service_user",
            email="selection-service@test.local",
            password="test-password",
        )

        self.customer = Organization.objects.create(
            name="Selection Customer",
            organization_type="customer",
            owner=self.user,
        )

        self.workshop_alpha = Organization.objects.create(
            name="Workshop Alpha",
            organization_type="workshop",
            owner=self.user,
        )

        self.workshop_beta = Organization.objects.create(
            name="Workshop Beta",
            organization_type="workshop",
            owner=self.user,
        )

        self.workshop_gamma = Organization.objects.create(
            name="Workshop Gamma",
            organization_type="workshop",
            owner=self.user,
        )

        self.workshop_delta = Organization.objects.create(
            name="Workshop Delta",
            organization_type="workshop",
            owner=self.user,
        )

        self.project = Project.objects.create(
            title="Selection Project",
            customer=self.customer,
        )

        self.tender = Tender.objects.create(
            project=self.project,
            title="Selection Tender",
            status="revealed",
            revealed_at=timezone.now(),
        )

        self.round = TenderRound.objects.create(
            tender=self.tender,
            round_number=1,
            status="closed",
        )

        self.bid_alpha = Bid.objects.create(
            tender_round=self.round,
            workshop=self.workshop_alpha,
            total_amount=100000000,
            production_days=10,
            delivery_days=5,
            warranty_months=24,
			status="submitted",
        )

        self.bid_beta = Bid.objects.create(
            tender_round=self.round,
            workshop=self.workshop_beta,
            total_amount=110000000,
            production_days=12,
            delivery_days=6,
            warranty_months=18,
			status="submitted",
        )

        self.bid_gamma = Bid.objects.create(
            tender_round=self.round,
            workshop=self.workshop_gamma,
            total_amount=120000000,
            production_days=14,
            delivery_days=7,
            warranty_months=12,
			status="submitted",
        )

        self.bid_delta = Bid.objects.create(
            tender_round=self.round,
            workshop=self.workshop_delta,
            total_amount=130000000,
            production_days=20,
            delivery_days=10,
            warranty_months=6,
			status="submitted",
        )


    def test_customer_can_select_top_3_bid(self):

        selection = select_tender_bid(
            self.tender.id,
            self.bid_alpha.id,
            self.user,
        )

        self.assertEqual(
            selection.tender,
            self.tender,
        )

        self.assertEqual(
            selection.bid,
            self.bid_alpha,
        )

        self.assertEqual(
            selection.selected_by,
            self.user,
        )

        self.assertEqual(
            selection.status,
            "selected",
        )


    def test_customer_selection_does_not_award_tender(self):

        select_tender_bid(
            self.tender.id,
            self.bid_alpha.id,
            self.user,
        )

        self.tender.refresh_from_db()

        self.assertEqual(
            self.tender.status,
            "revealed",
        )

        self.assertIsNone(
            self.tender.winner_bid,
        )

        self.assertFalse(
            TenderAward.objects.filter(
                tender=self.tender
            ).exists()
        )


    def test_customer_cannot_select_bid_outside_top_3(self):

        with self.assertRaisesMessage(
            ValueError,
            "Selected bid is not in top 3.",
        ):
            select_tender_bid(
                self.tender.id,
                self.bid_delta.id,
                self.user,
            )


    def test_customer_selection_can_be_changed(self):

        first_selection = select_tender_bid(
            self.tender.id,
            self.bid_alpha.id,
            self.user,
        )

        second_selection = select_tender_bid(
            self.tender.id,
            self.bid_beta.id,
            self.user,
        )

        self.assertEqual(
            first_selection.id,
            second_selection.id,
        )

        self.assertEqual(
            second_selection.bid,
            self.bid_beta,
        )

        self.assertEqual(
            CustomerTenderSelection.objects.count(),
            1,
        )
    def test_non_customer_user_cannot_select_tender_bid(self):

        User = get_user_model()

        other_user = User.objects.create_user(
            username="other_selection_user",
            email="other-selection@test.local",
            password="test-password",
        )

        with self.assertRaisesMessage(
          ValueError,
          "User is not authorized to select this tender.",
        ):
            select_tender_bid(
                self.tender.id,
                self.bid_alpha.id,
                other_user,
            )
class TenderAwardAPITests(TestCase):

    def setUp(self):
        User = get_user_model()

        self.user = User.objects.create_user(
            username="award_api_user",
            email="award-api@test.local",
            password="test-password",
        )

        self.customer = Organization.objects.create(
            name="Award API Customer",
            organization_type="customer",
            owner=self.user,
        )

        self.workshop = Organization.objects.create(
            name="Award API Workshop",
            organization_type="workshop",
            owner=self.user,
        )

        self.project = Project.objects.create(
            title="Award API Project",
            customer=self.customer,
            created_by=self.user,
        )

        self.tender = Tender.objects.create(
            project=self.project,
            title="Award API Tender",
            status="revealed",
            revealed_at=timezone.now(),
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
			status="submitted",
        )

        self.client = APIClient()

        self.client.force_authenticate(
            user=self.user
        )

    def test_award_endpoint_returns_201(self):

        response = self.client.post(
            "/api/tenders/{}/award/".format(
                self.tender.id
            ),
            {
                "bid_id": self.bid.id
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

    def test_award_endpoint_updates_tender_status(self):

        response = self.client.post(
            "/api/tenders/{}/award/".format(
                self.tender.id
            ),
            {
                "bid_id": self.bid.id
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        self.tender.refresh_from_db()

        self.assertEqual(
            self.tender.status,
            "awarded",
        )

    def test_award_endpoint_creates_award(self):

        response = self.client.post(
            "/api/tenders/{}/award/".format(
                self.tender.id
            ),
            {
                "bid_id": self.bid.id
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        self.assertTrue(
            TenderAward.objects.filter(
                tender=self.tender,
                bid=self.bid,
            ).exists()
        )
    def test_award_endpoint_rejects_unrevealed_tender(self):

        self.tender.status = "open"

        self.tender.save(
            update_fields=["status"]
        )

        response = self.client.post(
            "/api/tenders/{}/award/".format(
                self.tender.id
            ),
            {
                "bid_id": self.bid.id
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.tender.refresh_from_db()

        self.assertNotEqual(
            self.tender.status,
            "awarded",
        )


    def test_award_endpoint_rejects_duplicate_award(self):

        first_response = self.client.post(
            "/api/tenders/{}/award/".format(
                self.tender.id
            ),
            {
                "bid_id": self.bid.id
            },
            format="json",
        )

        self.assertEqual(
            first_response.status_code,
            201,
        )

        second_response = self.client.post(
            "/api/tenders/{}/award/".format(
                self.tender.id
            ),
            {
                "bid_id": self.bid.id
            },
            format="json",
        )

        self.assertEqual(
            second_response.status_code,
            400,
        )


    def test_award_endpoint_rejects_bid_from_another_tender(self):

        other_project = Project.objects.create(
            title="Other Award Project",
            customer=self.customer,
            created_by=self.user,
        )

        other_tender = Tender.objects.create(
            project=other_project,
            title="Other Award Tender",
            status="revealed",
            revealed_at=timezone.now(),
        )

        other_round = TenderRound.objects.create(
            tender=other_tender,
            round_number=1,
            status="closed",
        )

        other_bid = Bid.objects.create(
            tender_round=other_round,
            workshop=self.workshop,
            total_amount=90000000,
            production_days=8,
            delivery_days=4,
            warranty_months=24,
        )

        response = self.client.post(
            "/api/tenders/{}/award/".format(
                self.tender.id
            ),
            {
                "bid_id": other_bid.id
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
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
					status="submitted",
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
				final_amount=1000000 - index * 10000,
                production_days=10,
                delivery_days=5,
                warranty_months=12,
				status="submitted",
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
class TenderRevealWorkflowTests(TestCase):

    def setUp(self):

        self.user = get_user_model().objects.create_user(
            username="reveal_workflow_user",
            password="test-password",
        )

        self.customer = Organization.objects.create(
            name="Reveal Workflow Customer",
            organization_type="customer",
            owner=self.user,
        )

        self.project = Project.objects.create(
            title="Reveal Workflow Project",
            customer=self.customer,
            created_by=self.user,
        )

        self.tender = Tender.objects.create(
            project=self.project,
            title="Workflow Tender",
            status="closed",
            reveal_at=timezone.now() + timedelta(hours=1),
        )
        self.round = TenderRound.objects.create(
            tender=self.tender,
            round_number=1,
            status="closed",
        )

    def test_cannot_reveal_before_time(self):

        with self.assertRaises(ValueError):

            reveal_tender(
                self.tender.id
            )


    def test_reveal_after_time(self):

        self.tender.reveal_at = (
            timezone.now()
            -
            timedelta(minutes=1)
        )

        self.tender.save()

        tender = reveal_tender(
            self.tender.id
        )

        self.assertEqual(
            tender.status,
            "revealed",
        )

        self.assertIsNotNone(
            tender.revealed_at
        )


    def test_cannot_reveal_twice(self):

        self.tender.reveal_at = (
            timezone.now()
            -
            timedelta(minutes=1)
        )

        self.tender.save()

        reveal_tender(
            self.tender.id
        )

        with self.assertRaises(ValueError):

            reveal_tender(
                self.tender.id
            )

class TenderCloseLifecycleTests(TestCase):

    def setUp(self):
        User = get_user_model()

        self.consultant_user = User.objects.create_user(
            username="tender_close_consultant",
            email="tender-close-consultant@test.local",
            password="test-password",
        )

        self.customer = Organization.objects.create(
            name="Tender Close Customer",
            organization_type="customer",
            owner=self.consultant_user,
        )

        self.company = Organization.objects.create(
            name="FEEMAAS Internal",
            organization_type="company",
            owner=self.consultant_user,
        )

        self.workshop_draft = Organization.objects.create(
            name="Workshop Draft",
            organization_type="workshop",
            owner=self.consultant_user,
        )

        self.workshop_submitted = Organization.objects.create(
            name="Workshop Submitted",
            organization_type="workshop",
            owner=self.consultant_user,
        )

        consultant_role = OrganizationRole.objects.create(
            name="consultant",
            organization_type="company",
        )

        consultant_membership = Membership.objects.create(
            user=self.consultant_user,
            organization=self.company,
            role_fk=consultant_role,
            status="active",
        )

        self.project = Project.objects.create(
            title="Tender Close Lifecycle Project",
            description="Test project for tender close lifecycle.",
            customer=self.customer,
            created_by=self.consultant_user,
            status="tender",
        )

        ProjectAssignment.objects.create(
            project=self.project,
            membership=consultant_membership,
            assigned_by=self.consultant_user,
            status="active",
        )

        self.tender = Tender.objects.create(
            project=self.project,
            title="Tender Close Lifecycle Tender",
            description="Test tender close lifecycle.",
            status="open",
        )

        self.round = TenderRound.objects.create(
            tender=self.tender,
            round_number=1,
            status="open",
            started_at=timezone.now(),
        )

        self.draft_bid = Bid.objects.create(
            tender_round=self.round,
            workshop=self.workshop_draft,
            status="draft",
        )

        self.submitted_bid = Bid.objects.create(
            tender_round=self.round,
            workshop=self.workshop_submitted,
            status="submitted",
        )

        self.client = APIClient()
        self.client.force_authenticate(
            user=self.consultant_user
        )

    def test_close_expires_draft_bids_but_keeps_submitted_bids(self):
        response = self.client.post(
            "/api/tenders/{}/close/".format(
                self.tender.id
            )
        )

        self.assertEqual(response.status_code, 200)

        self.round.refresh_from_db()
        self.tender.refresh_from_db()
        self.draft_bid.refresh_from_db()
        self.submitted_bid.refresh_from_db()

        self.assertEqual(
            self.round.status,
            "closed",
        )

        self.assertEqual(
            self.tender.status,
            "closed",
        )

        self.assertEqual(
            self.draft_bid.status,
            "expired",
        )

        self.assertEqual(
            self.submitted_bid.status,
            "submitted",
        )

class TenderParticipantResponseTests(TestCase):

    def setUp(self):

        User = get_user_model()

        self.user = User.objects.create_user(
            username="workshop_response_test",
            password="test-password",
        )

        self.customer = Organization.objects.create(
            name="Response Customer",
            organization_type="customer",
            owner=self.user,
        )

        self.workshop = Organization.objects.create(
            name="Response Workshop",
            organization_type="workshop",
            owner=self.user,
        )
        Membership.objects.create(
            user=self.user,
            organization=self.workshop,
            status="active",
        )

        self.project = Project.objects.create(
            title="Participant Response Project",
            description="test",
            customer=self.customer,
            created_by=self.user,
            status="tender",
        )

        self.project_item = ProjectItem.objects.create(
            project=self.project,
            name="Test Item",
            description="test item",
            quantity=1,
        )

        self.tender = Tender.objects.create(
            project=self.project,
            title="Participant Response Tender",
            status="open",
        )

        self.round = TenderRound.objects.create(
            tender=self.tender,
            round_number=1,
            status="open",
        )

        self.participant = TenderParticipant.objects.create(
            tender=self.tender,
            organization=self.workshop,
        )

        self.client = APIClient()

        self.client.force_authenticate(
            user=self.user
        )


    def test_accept_creates_draft_bid(self):

        response = self.client.post(
            f"/api/tenders/participants/{self.participant.id}/respond/",
            {
                "response_status": "accepted"
            },
            format="json",
        )


        self.assertEqual(
            response.status_code,
            200,
        )


        self.assertEqual(
            response.data["response_status"],
            "accepted",
        )


        self.assertTrue(
            Bid.objects.filter(
                id=response.data["bid_id"]
            ).exists()
        )


        bid = Bid.objects.get(
            id=response.data["bid_id"]
        )


        self.assertEqual(
            bid.status,
            "draft",
        )
    def test_accept_fails_when_round_is_closed(self):

        self.round.status = "closed"
        self.round.closed_at = timezone.now()
        self.round.save(
            update_fields=[
                "status",
                "closed_at",
            ]
        )

        response = self.client.post(
            f"/api/tenders/participants/{self.participant.id}/respond/",
            {
                "response_status": "accepted"
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.participant.refresh_from_db()

        self.assertIsNone(
            self.participant.responded_at,
        )

        self.assertNotEqual(
            self.participant.response_status,
            "accepted",
        )

        self.assertFalse(
            Bid.objects.filter(
                tender_round=self.round,
                workshop=self.workshop,
            ).exists()
        )
    def test_submit_draft_bid(self):

        bid = Bid.objects.create(
            tender_round=self.round,
            workshop=self.workshop,
            status="draft",
        )
        BidItem.objects.create(
            bid=bid,
            project_item=self.project_item,
            quantity=1,
            unit_price=1000000,
        )

        for stage_order, percentage, title in [
            (1, Decimal("30.00"), "پیش‌پرداخت"),
            (2, Decimal("40.00"), "حین تولید"),
            (3, Decimal("30.00"), "تحویل"),
        ]:
            PaymentSchedule.objects.create(
                bid=bid,
                stage_order=stage_order,
                title=title,
                percentage=percentage,
            )

        response = self.client.post(
            f"/api/tenders/bids/{bid.id}/submit/",
            {},
            format="json",
        )


        self.assertEqual(
            response.status_code,
            200,
        )

        bid.refresh_from_db()

        self.assertEqual(
            bid.status,
            "submitted",
        )

        self.assertEqual(
            response.data["bid_status"],
            "submitted",
        )
    def test_submit_draft_bid_fails_when_payment_total_is_not_100(self):

        bid = Bid.objects.create(
            tender_round=self.round,
            workshop=self.workshop,
            status="draft",
        )

        BidItem.objects.create(
            bid=bid,
            project_item=self.project_item,
            quantity=1,
            unit_price=1000000,
        )

        for stage_order, percentage, title in [
            (1, Decimal("40.00"), "مرحله اول"),
            (2, Decimal("40.00"), "مرحله دوم"),
            (3, Decimal("10.00"), "مرحله سوم"),
        ]:
            PaymentSchedule.objects.create(
                bid=bid,
                stage_order=stage_order,
                title=title,
                percentage=percentage,
            )

        response = self.client.post(
            f"/api/tenders/bids/{bid.id}/submit/",
            {},
            format="json",
        )

        self.assertEqual(response.status_code, 400)

        bid.refresh_from_db()
        self.assertEqual(bid.status, "draft")

    def test_submit_draft_bid_fails_when_round_is_closed(self):

        bid = Bid.objects.create(
            tender_round=self.round,
            workshop=self.workshop,
            status="draft",
        )

        BidItem.objects.create(
            bid=bid,
            project_item=self.project_item,
            quantity=1,
            unit_price=1000000,
        )

        self.round.status = "closed"
        self.round.closed_at = timezone.now()
        self.round.save(
            update_fields=[
                "status",
                "closed_at",
            ]
        )

        response = self.client.post(
            f"/api/tenders/bids/{bid.id}/submit/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        bid.refresh_from_db()

        self.assertEqual(
            bid.status,
            "draft",
        )

class BidDraftSaveAPITests(TestCase):

    def setUp(self):

        User = get_user_model()

        self.user = User.objects.create_user(
            username="draft_save_test",
			email="draft_save_test@example.com",
            password="test-password",
        )

        self.other_user = User.objects.create_user(
            username="draft_save_other",
			email="draft_save_other@example.com",
            password="test-password",
        )

        self.customer = Organization.objects.create(
            name="Draft Save Customer",
            organization_type="customer",
            owner=self.user,
        )

        self.workshop = Organization.objects.create(
            name="Draft Save Workshop",
            organization_type="workshop",
            owner=self.user,
        )

        self.other_workshop = Organization.objects.create(
            name="Other Draft Workshop",
            organization_type="workshop",
            owner=self.other_user,
        )

        Membership.objects.create(
            user=self.user,
            organization=self.workshop,
            status="active",
        )

        Membership.objects.create(
            user=self.other_user,
            organization=self.other_workshop,
            status="active",
        )

        self.project = Project.objects.create(
            title="Draft Save Project",
            description="test",
            customer=self.customer,
            created_by=self.user,
            status="tender",
        )

        self.project_item_1 = ProjectItem.objects.create(
            project=self.project,
            name="Draft Item 1",
            description="item 1",
            quantity=2,
        )

        self.project_item_2 = ProjectItem.objects.create(
            project=self.project,
            name="Draft Item 2",
            description="item 2",
            quantity=3,
        )

        self.tender = Tender.objects.create(
            project=self.project,
            title="Draft Save Tender",
            status="open",
        )

        self.round = TenderRound.objects.create(
            tender=self.tender,
            round_number=1,
            status="open",
        )

        TenderParticipant.objects.create(
            tender=self.tender,
            organization=self.workshop,
        )

        self.bid = Bid.objects.create(
            tender_round=self.round,
            workshop=self.workshop,
            status="draft",
        )

        self.client = APIClient()

        self.client.force_authenticate(
            user=self.user
        )

    def test_draft_save_creates_items_and_payment_schedules(self):

        response = self.client.patch(
            f"/api/tenders/bids/{self.bid.id}/draft/",
            {
                "production_days": 20,
                "delivery_days": 5,
                "warranty_months": 12,
                "technical_notes": "draft technical notes",
                "discount_percentage": "3.5",
                "items": [
                    {
                        "project_item": self.project_item_1.id,
                        "quantity": 2,
                        "unit_price": "1500000",
                        "availability": "available",
                        "technical_notes": "item notes",
                    },
                    {
                        "project_item": self.project_item_2.id,
                        "quantity": 3,
                        "unit_price": "2000000",
                        "availability": "available",
                        "technical_notes": "",
                    },
                ],
                "payment_schedules": [
                    {
                        "stage_order": 1,
                        "title": "پیش‌پرداخت",
                        "percentage": "30",
                    },
                    {
                        "stage_order": 2,
                        "title": "تحویل",
                        "percentage": "70",
                    },
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)

        self.bid.refresh_from_db()

        self.assertEqual(
            self.bid.production_days,
            20,
        )
        self.assertEqual(
            self.bid.delivery_days,
            5,
        )
        self.assertEqual(
            self.bid.warranty_months,
            12,
        )
        self.assertEqual(
            self.bid.technical_notes,
            "draft technical notes",
        )
        self.assertEqual(
            self.bid.discount_percentage,
            Decimal("3.5"),
        )

        self.assertEqual(
            self.bid.items.count(),
            2,
        )

        self.assertEqual(
            self.bid.payment_schedules.count(),
            2,
        )

        self.assertEqual(
            self.bid.total_amount,
            Decimal("9000000"),
        )

        self.assertEqual(
            self.bid.discount_amount,
            Decimal("315000"),
        )

        self.assertEqual(
            self.bid.final_amount,
            Decimal("8685000"),
        )

    def test_second_draft_save_updates_existing_records_without_duplicates(self):

        first_payload = {
            "items": [
                {
                    "project_item": self.project_item_1.id,
                    "quantity": 2,
                    "unit_price": "1000000",
                    "availability": "available",
                },
                {
                    "project_item": self.project_item_2.id,
                    "quantity": 3,
                    "unit_price": "2000000",
                    "availability": "available",
                },
            ],
            "payment_schedules": [
                {
                    "stage_order": 1,
                    "title": "مرحله اول",
                    "percentage": "30",
                },
                {
                    "stage_order": 2,
                    "title": "مرحله دوم",
                    "percentage": "70",
                },
            ],
        }

        first_response = self.client.patch(
            f"/api/tenders/bids/{self.bid.id}/draft/",
            first_payload,
            format="json",
        )

        self.assertEqual(first_response.status_code, 200)

        first_item_ids = set(
            self.bid.items.values_list("id", flat=True)
        )

        first_schedule_ids = set(
            self.bid.payment_schedules.values_list("id", flat=True)
        )

        second_response = self.client.patch(
            f"/api/tenders/bids/{self.bid.id}/draft/",
            {
                "production_days": 25,
                "items": [
                    {
                        "project_item": self.project_item_1.id,
                        "quantity": 5,
                        "unit_price": "1200000",
                        "availability": "available",
                    },
                    {
                        "project_item": self.project_item_2.id,
                        "quantity": 1,
                        "unit_price": "2500000",
                        "availability": "unavailable",
                    },
                ],
                "payment_schedules": [
                    {
                        "stage_order": 1,
                        "title": "مرحله اول اصلاح‌شده",
                        "percentage": "40",
                    },
                    {
                        "stage_order": 2,
                        "title": "مرحله دوم اصلاح‌شده",
                        "percentage": "60",
                    },
                ],
            },
            format="json",
        )

        self.assertEqual(second_response.status_code, 200)

        self.bid.refresh_from_db()

        self.assertEqual(
            self.bid.production_days,
            25,
        )

        self.assertEqual(
            self.bid.items.count(),
            2,
        )

        self.assertEqual(
            self.bid.payment_schedules.count(),
            2,
        )

        second_item_ids = set(
            self.bid.items.values_list("id", flat=True)
        )

        second_schedule_ids = set(
            self.bid.payment_schedules.values_list("id", flat=True)
        )

        self.assertEqual(
            first_item_ids,
            second_item_ids,
        )

        self.assertEqual(
            first_schedule_ids,
            second_schedule_ids,
        )

        updated_item = self.bid.items.get(
            project_item=self.project_item_1
        )

        self.assertEqual(
            updated_item.quantity,
            Decimal("5"),
        )

        self.assertEqual(
            updated_item.unit_price,
            Decimal("1200000"),
        )

        updated_schedule = self.bid.payment_schedules.get(
            stage_order=1
        )

        self.assertEqual(
            updated_schedule.title,
            "مرحله اول اصلاح‌شده",
        )

        self.assertEqual(
            updated_schedule.percentage,
            Decimal("40"),
        )

    def test_draft_save_deletes_removed_items_and_payment_stages(self):

        BidItem.objects.create(
            bid=self.bid,
            project_item=self.project_item_1,
            quantity=1,
            unit_price=1000000,
        )

        BidItem.objects.create(
            bid=self.bid,
            project_item=self.project_item_2,
            quantity=1,
            unit_price=2000000,
        )

        PaymentSchedule.objects.create(
            bid=self.bid,
            stage_order=1,
            title="مرحله اول",
            percentage=30,
            amount=0,
        )

        PaymentSchedule.objects.create(
            bid=self.bid,
            stage_order=2,
            title="مرحله دوم",
            percentage=70,
            amount=0,
        )

        response = self.client.patch(
            f"/api/tenders/bids/{self.bid.id}/draft/",
            {
                "items": [
                    {
                        "project_item": self.project_item_1.id,
                        "quantity": 2,
                        "unit_price": "500000",
                        "availability": "available",
                    }
                ],
                "payment_schedules": [
                    {
                        "stage_order": 1,
                        "title": "فقط مرحله اول",
                        "percentage": "100",
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            self.bid.items.count(),
            1,
        )

        self.assertTrue(
            self.bid.items.filter(
                project_item=self.project_item_1
            ).exists()
        )

        self.assertFalse(
            self.bid.items.filter(
                project_item=self.project_item_2
            ).exists()
        )

        self.assertEqual(
            self.bid.payment_schedules.count(),
            1,
        )

        self.assertTrue(
            self.bid.payment_schedules.filter(
                stage_order=1
            ).exists()
        )

        self.assertFalse(
            self.bid.payment_schedules.filter(
                stage_order=2
            ).exists()
        )

    def test_other_workshop_cannot_save_bid(self):

        self.client.force_authenticate(
            user=self.other_user
        )

        response = self.client.patch(
            f"/api/tenders/bids/{self.bid.id}/draft/",
            {
                "production_days": 50,
                "items": [],
                "payment_schedules": [],
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.bid.refresh_from_db()

        self.assertEqual(
            self.bid.production_days,
            None,
        )

    def test_submitted_bid_cannot_be_draft_saved(self):

        self.bid.status = "submitted"
        self.bid.save(update_fields=["status"])

        response = self.client.patch(
            f"/api/tenders/bids/{self.bid.id}/draft/",
            {
                "production_days": 50,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

    def test_incomplete_draft_is_allowed(self):

        response = self.client.patch(
            f"/api/tenders/bids/{self.bid.id}/draft/",
            {
                "production_days": 10,
                "items": [],
                "payment_schedules": [
                    {
                        "stage_order": 1,
                        "title": "پیش‌پرداخت",
                        "percentage": "70",
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.bid.refresh_from_db()

        self.assertEqual(
            self.bid.total_amount,
            Decimal("0"),
        )

        self.assertEqual(
            self.bid.payment_schedules.count(),
            1,
        )

        self.assertEqual(
            self.bid.payment_schedules.first().percentage,
            Decimal("70"),
        )

    def test_project_item_from_another_tender_is_rejected(self):

        other_project = Project.objects.create(
            title="Other Project",
            description="other",
            customer=self.customer,
            created_by=self.user,
            status="tender",
        )

        other_item = ProjectItem.objects.create(
            project=other_project,
            name="Other Item",
            description="other item",
            quantity=1,
        )

        response = self.client.patch(
            f"/api/tenders/bids/{self.bid.id}/draft/",
            {
                "items": [
                    {
                        "project_item": other_item.id,
                        "quantity": 1,
                        "unit_price": "1000000",
                        "availability": "available",
                    }
                ],
                "payment_schedules": [],
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.assertEqual(
            self.bid.items.count(),
            0,
        )
    def test_draft_save_fails_when_round_is_closed(self):

        self.round.status = "closed"
        self.round.closed_at = timezone.now()
        self.round.save(
            update_fields=[
                "status",
                "closed_at",
            ]
        )

        response = self.client.patch(
            f"/api/tenders/bids/{self.bid.id}/draft/",
            {
                "production_days": 30,
                "technical_notes": "should not save",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.bid.refresh_from_db()

        self.assertEqual(
            self.bid.production_days,
            None,
        )

        self.assertEqual(
            self.bid.technical_notes,
            "",
        )


class AnonymousTenderBidAPITests(TestCase):

    def setUp(self):

        User = get_user_model()

        self.user = User.objects.create_user(
            username="anonymous_bid_api_user",
            email="anonymous-bid-api@test.local",
            password="test-password",
        )

        self.customer = Organization.objects.create(
            name="Anonymous API Customer",
            organization_type="customer",
            owner=self.user,
        )

        self.workshops = []

        for index in range(3):

            self.workshops.append(
                Organization.objects.create(
                    name=f"Secret Workshop {index}",
                    organization_type="workshop",
                    owner=self.user,
                )
            )

        self.project = Project.objects.create(
            title="Anonymous Reveal Project",
            customer=self.customer,
            created_by=self.user,
            status="tender",
        )

        self.tender = Tender.objects.create(
            project=self.project,
            title="Anonymous Reveal Tender",
            status="open",
            reveal_at=timezone.now() + timedelta(hours=1),
        )

        self.round = TenderRound.objects.create(
            tender=self.tender,
            round_number=1,
            status="closed",
        )

        self.submitted_bid = Bid.objects.create(
            tender_round=self.round,
            workshop=self.workshops[0],
            total_amount=9000000,
            production_days=10,
            delivery_days=5,
            warranty_months=12,
            status="submitted",
        )

        self.draft_bid = Bid.objects.create(
            tender_round=self.round,
            workshop=self.workshops[1],
            total_amount=8000000,
            production_days=8,
            delivery_days=4,
            warranty_months=18,
            status="draft",
        )

        self.client = APIClient()


    def test_anonymous_bids_hidden_before_reveal(self):

        response = self.client.get(
            "/api/tenders/{}/anonymous-bids/".format(
                self.tender.id
            )
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            response.json(),
            [],
        )


    def test_anonymous_bids_visible_after_reveal(self):

        self.tender.status = "revealed"
        self.tender.revealed_at = timezone.now()
        self.tender.save(
            update_fields=[
                "status",
                "revealed_at",
            ]
        )

        response = self.client.get(
            "/api/tenders/{}/anonymous-bids/".format(
                self.tender.id
            )
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        data = response.json()

        self.assertEqual(
            len(data),
            1,
        )

        self.assertEqual(
            data[0]["id"],
            self.submitted_bid.id,
        )


    def test_anonymous_bid_does_not_expose_workshop_identity(self):

        self.tender.status = "revealed"
        self.tender.revealed_at = timezone.now()
        self.tender.save(
            update_fields=[
                "status",
                "revealed_at",
            ]
        )

        response = self.client.get(
            "/api/tenders/{}/anonymous-bids/".format(
                self.tender.id
            )
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        data = response.json()

        self.assertEqual(
            len(data),
            1,
        )

        self.assertNotIn(
            "workshop",
            data[0],
        )

        self.assertNotIn(
            "workshop_name",
            data[0],
        )


    def test_anonymous_bids_exclude_drafts(self):

        self.tender.status = "revealed"
        self.tender.revealed_at = timezone.now()
        self.tender.save(
            update_fields=[
                "status",
                "revealed_at",
            ]
        )

        response = self.client.get(
            "/api/tenders/{}/anonymous-bids/".format(
                self.tender.id
            )
        )

        data = response.json()

        bid_ids = [
            item["id"]
            for item in data
        ]

        self.assertIn(
            self.submitted_bid.id,
            bid_ids,
        )

        self.assertNotIn(
            self.draft_bid.id,
            bid_ids,
        )

    def test_anonymous_bids_use_latest_revealed_round_only(self):
        older_round = TenderRound.objects.create(
            tender=self.tender,
            round_number=2,
            status="evaluated",
        )

        older_bid = Bid.objects.create(
            tender_round=older_round,
            workshop=self.workshops[2],
            total_amount=7000000,
            production_days=7,
            delivery_days=3,
            warranty_months=24,
            status="submitted",
        )

        self.tender.status = "revealed"
        self.tender.revealed_at = timezone.now()
        self.tender.save(
            update_fields=[
                "status",
                "revealed_at",
            ]
        )

        response = self.client.get(
            "/api/tenders/{}/anonymous-bids/".format(
                self.tender.id
            )
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        data = response.json()

        bid_ids = [
            item["id"]
            for item in data
        ]

        self.assertIn(
            older_bid.id,
            bid_ids,
        )

        self.assertNotIn(
            self.submitted_bid.id,
            bid_ids,
        )
