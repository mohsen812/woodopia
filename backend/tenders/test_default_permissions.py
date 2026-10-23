from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient


class AnonymousAccessTests(TestCase):
    """Anonymous users must never reach tender endpoints."""

    def setUp(self):
        self.client = APIClient()

    def _assert_denied(self, response):
        self.assertIn(response.status_code, (401, 403))

    def test_anonymous_get_is_denied(self):
        for name, kwargs in [
            ("tender-list-create", {}),
            ("tender-detail", {"pk": 1}),
            ("tender-anonymous-bids", {"tender_id": 1}),
        ]:
            with self.subTest(route=name):
                self._assert_denied(
                    self.client.get(reverse(name, kwargs=kwargs))
                )

    def test_anonymous_post_is_denied(self):
        for name, kwargs in [
            ("tender-list-create", {}),
            ("tender-select-bid", {"tender_id": 1}),
            ("tender-award", {"pk": 1}),
        ]:
            with self.subTest(route=name):
                self._assert_denied(
                    self.client.post(
                        reverse(name, kwargs=kwargs), {}, format="json"
                    )
                )