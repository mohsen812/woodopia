from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from organizations.models import Organization
from projects.models import Project
from .models import Tender


class AnonymousBidsScopingTests(TestCase):

    def setUp(self):
        User = get_user_model()
        self.owner = User.objects.create_user(
            username="ab_owner", email="ab_owner@test.local", password="x"
        )
        self.stranger = User.objects.create_user(
            username="ab_stranger", email="ab_stranger@test.local", password="x"
        )
        customer = Organization.objects.create(
            name="AB Customer", organization_type="customer", owner=self.owner
        )
        project = Project.objects.create(
            title="AB Project", customer=customer, created_by=self.owner
        )
        self.tender = Tender.objects.create(
            project=project,
            title="AB Tender",
            status="revealed",
            revealed_at=timezone.now(),
        )
        self.url = f"/api/tenders/{self.tender.id}/anonymous-bids/"

    def test_unrelated_user_cannot_list(self):
        client = APIClient()
        client.force_authenticate(user=self.stranger)
        self.assertEqual(client.get(self.url).status_code, 404)

    def test_customer_owner_can_list(self):
        client = APIClient()
        client.force_authenticate(user=self.owner)
        self.assertEqual(client.get(self.url).status_code, 200)

    def test_unknown_tender_returns_404_not_500(self):
        client = APIClient()
        client.force_authenticate(user=self.owner)
        self.assertEqual(
            client.get("/api/tenders/999999/anonymous-bids/").status_code, 404
        )