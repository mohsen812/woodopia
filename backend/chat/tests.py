from asgiref.sync import async_to_sync, sync_to_async
from asgiref.testing import ApplicationCommunicator
import json
from django.contrib.auth.models import AnonymousUser
from .consumers import ProjectChatConsumer
import base64
import os
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TransactionTestCase
from rest_framework.test import APIClient

from organizations.models import (
    Membership,
    Organization,
    OrganizationRole,
)
from projects.models import Project, ProjectAssignment
from projects.services import reassign_project_consultant
from tenders.models import Tender, TenderParticipant

from .models import Conversation, ConversationParticipant, Message
from workspace.services import ACTIVE_MEMBERSHIP_SESSION_KEY

from .services import (
    can_send_project_message,
    decrypt_chat_message,
    get_decrypted_messages,
    get_eligible_memberships,
    send_message,
    sync_conversation_participants,
    refresh_project_chat_access,
)


User = get_user_model()


class ChatServiceTests(TransactionTestCase):
    def setUp(self):
        self.customer_role = OrganizationRole.objects.create(
            name="owner",
            organization_type="customer",
        )
        self.consultant_role = OrganizationRole.objects.create(
            name="consultant",
            organization_type="company",
        )
        self.workshop_role = OrganizationRole.objects.create(
            name="member",
            organization_type="workshop",
        )

        self.customer_user = self.create_user("customer")
        self.consultant_user = self.create_user("consultant")
        self.new_consultant_user = self.create_user("newconsultant")
        self.workshop_user = self.create_user("workshop")
        self.pending_workshop_user = self.create_user("pendingworkshop")
        self.operations_user = self.create_user("operations")

        self.customer_org = self.create_organization(
            "Customer",
            "customer",
            self.customer_user,
        )
        self.consultant_org = self.create_organization(
            "Consultant",
            "company",
            self.consultant_user,
        )
        self.new_consultant_org = self.create_organization(
            "New Consultant",
            "company",
            self.new_consultant_user,
        )
        self.workshop_org = self.create_organization(
            "Accepted Workshop",
            "workshop",
            self.workshop_user,
        )
        self.pending_workshop_org = self.create_organization(
            "Pending Workshop",
            "workshop",
            self.pending_workshop_user,
        )

        self.customer_membership = self.create_membership(
            self.customer_user,
            self.customer_org,
            self.customer_role,
        )
        self.consultant_membership = self.create_membership(
            self.consultant_user,
            self.consultant_org,
            self.consultant_role,
        )
        self.new_consultant_membership = self.create_membership(
            self.new_consultant_user,
            self.new_consultant_org,
            self.consultant_role,
        )
        self.workshop_membership = self.create_membership(
            self.workshop_user,
            self.workshop_org,
            self.workshop_role,
        )
        self.pending_workshop_membership = self.create_membership(
            self.pending_workshop_user,
            self.pending_workshop_org,
            self.workshop_role,
        )

        self.project = Project.objects.create(
            title="Chat test project",
            customer=self.customer_org,
            created_by=self.customer_user,
            status="consulting",
        )

        self.assignment = ProjectAssignment.objects.create(
            project=self.project,
            membership=self.consultant_membership,
            assigned_by=self.operations_user,
            status="active",
        )

        self.conversation = Conversation.objects.create(
            project=self.project,
            created_by=self.customer_user,
        )

    def create_user(self, username):
        return User.objects.create_user(
            username=username,
            email="{}@example.test".format(username),
            password="test-password",
        )

    def create_organization(self, name, organization_type, owner):
        return Organization.objects.create(
            name=name,
            organization_type=organization_type,
            status="active",
            owner=owner,
        )

    def create_membership(self, user, organization, role):
        return Membership.objects.create(
            user=user,
            organization=organization,
            role_fk=role,
            status="active",
        )

    def add_workshop_tender_participation(self, organization, response_status):
        tender = Tender.objects.create(
            project=self.project,
            title="Chat test tender",
            status="closed",
        )
        return TenderParticipant.objects.create(
            tender=tender,
            organization=organization,
            response_status=response_status,
        )

    def test_eligible_memberships_include_customer_and_assigned_consultant(self):
        eligible_ids = set(
            get_eligible_memberships(self.project).values_list(
                "id",
                flat=True,
            )
        )

        self.assertIn(self.customer_membership.id, eligible_ids)
        self.assertIn(self.consultant_membership.id, eligible_ids)
        self.assertNotIn(self.new_consultant_membership.id, eligible_ids)

    def test_only_accepted_workshop_participates_in_chat(self):
        self.add_workshop_tender_participation(
            self.workshop_org,
            "accepted",
        )
        self.add_workshop_tender_participation(
            self.pending_workshop_org,
            "pending",
        )

        eligible_ids = set(
            get_eligible_memberships(self.project).values_list(
                "id",
                flat=True,
            )
        )

        self.assertIn(self.workshop_membership.id, eligible_ids)
        self.assertNotIn(self.pending_workshop_membership.id, eligible_ids)

    def test_sync_creates_only_eligible_active_participants(self):
        self.add_workshop_tender_participation(
            self.workshop_org,
            "accepted",
        )
        self.add_workshop_tender_participation(
            self.pending_workshop_org,
            "pending",
        )

        participants = sync_conversation_participants(
            self.conversation,
            added_by=self.operations_user,
        )
        participant_ids = set(
            participants.values_list("membership_id", flat=True)
        )

        self.assertEqual(
            participant_ids,
            {
                self.customer_membership.id,
                self.consultant_membership.id,
                self.workshop_membership.id,
            },
        )

    def test_consultant_reassignment_preserves_conversation_and_revokes_old_access(self):
        sync_conversation_participants(
            self.conversation,
            added_by=self.operations_user,
        )

        new_assignment, changed = reassign_project_consultant(
            self.project,
            self.new_consultant_membership,
            self.operations_user,
        )

        self.assertTrue(changed)
        self.assertEqual(
            new_assignment.membership_id,
            self.new_consultant_membership.id,
        )
        self.assertEqual(
            Conversation.objects.get(project=self.project).id,
            self.conversation.id,
        )

        sync_conversation_participants(
            self.conversation,
            added_by=self.operations_user,
        )

        old_participant = ConversationParticipant.objects.get(
            conversation=self.conversation,
            membership=self.consultant_membership,
        )
        new_participant = ConversationParticipant.objects.get(
            conversation=self.conversation,
            membership=self.new_consultant_membership,
        )

        self.assertEqual(old_participant.status, "removed")
        self.assertEqual(new_participant.status, "active")

    def test_same_consultant_reassignment_does_not_create_duplicate_assignment(self):
        assignment_count = ProjectAssignment.objects.filter(
            project=self.project,
        ).count()

        assignment, changed = reassign_project_consultant(
            self.project,
            self.consultant_membership,
            self.operations_user,
        )

        self.assertFalse(changed)
        self.assertEqual(assignment.pk, self.assignment.pk)
        self.assertEqual(
            ProjectAssignment.objects.filter(project=self.project).count(),
            assignment_count,
        )

    def test_encrypted_message_can_be_decrypted_by_authorized_participant(self):
        sync_conversation_participants(
            self.conversation,
            added_by=self.operations_user,
        )

        encoded_key = base64.urlsafe_b64encode(
            b"K" * 32
        ).decode("ascii").rstrip("=")

        with patch.dict(
            os.environ,
            {"FEEMAAS_CHAT_ENCRYPTION_KEY_V1": encoded_key},
        ):
            message = send_message(
                self.conversation,
                self.customer_membership,
                "سلام، پیام آزمایشی",
            )

            self.assertIsInstance(message.ciphertext, bytes)
            self.assertNotIn(
                "سلام، پیام آزمایشی".encode("utf-8"),
                message.ciphertext,
            )
            self.assertEqual(
                decrypt_chat_message(message),
                "سلام، پیام آزمایشی",
            )

            messages = get_decrypted_messages(
                self.conversation,
                self.customer_membership,
            )

        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].plaintext, "سلام، پیام آزمایشی")

    def test_chat_sending_follows_project_lifecycle(self):
        for status in ("draft", "consulting", "tender", "production"):
            self.project.status = status
            self.assertTrue(
                can_send_project_message(self.project),
                "Chat should allow sending when status is {}".format(status),
            )

        for status in ("completed", "cancelled"):
            self.project.status = status
            self.assertFalse(
                can_send_project_message(self.project),
                "Chat should be read-only when status is {}".format(status),
            )

    def test_completed_project_is_read_only_but_history_remains_readable(self):
        sync_conversation_participants(
            self.conversation,
            added_by=self.operations_user,
        )

        encoded_key = base64.urlsafe_b64encode(
            b"K" * 32
        ).decode("ascii").rstrip("=")

        with patch.dict(
            os.environ,
            {"FEEMAAS_CHAT_ENCRYPTION_KEY_V1": encoded_key},
        ):
            message = send_message(
                self.conversation,
                self.customer_membership,
                "پیام پیش از تکمیل پروژه",
            )

            self.project.status = "completed"
            self.project.save(update_fields=["status"])

            self.assertFalse(can_send_project_message(self.project))

            with self.assertRaises(PermissionError):
                send_message(
                    self.conversation,
                    self.customer_membership,
                    "پیام پس از تکمیل پروژه",
                )

            messages = get_decrypted_messages(
                self.conversation,
                self.customer_membership,
            )

        self.assertEqual(len(messages), 1)
        self.assertEqual(
            messages[0].plaintext,
            "پیام پیش از تکمیل پروژه",
        )
        self.assertEqual(message.pk, messages[0].pk)

    def _websocket_application(self, user):
        consumer_application = ProjectChatConsumer.as_asgi()

        async def application(scope, receive, send):
            scope = dict(scope)
            scope["user"] = user
            scope["url_route"] = {
                "kwargs": {
                    "conversation_id": str(self.conversation.pk),
                }
            }
            await consumer_application(scope, receive, send)

        return application

    def _websocket_communicator(self, user, membership_id):
        path = "/ws/chat/{}/".format(self.conversation.pk)
        query_string = "membership_id={}".format(membership_id)

        scope = {
            "type": "websocket",
            "asgi": {"version": "3.0"},
            "http_version": "1.1",
            "scheme": "ws",
            "server": ("testserver", 80),
            "client": ("127.0.0.1", 12345),
            "root_path": "",
            "path": path,
            "raw_path": path.encode("utf-8"),
            "query_string": query_string.encode("utf-8"),
            "headers": [],
            "subprotocols": [],
        }

        return ApplicationCommunicator(
            self._websocket_application(user),
            scope,
        )

    def test_authenticated_participant_can_connect_and_receive_history(self):
        sync_conversation_participants(
            self.conversation,
            added_by=self.operations_user,
        )

        async def run():
            communicator = self._websocket_communicator(
                self.customer_user,
                self.customer_membership.pk,
            )

            await communicator.send_input({
                "type": "websocket.connect",
            })
            response = await communicator.receive_output()

            self.assertEqual(response["type"], "websocket.accept")

            event = await communicator.receive_output()
            payload = json.loads(
                event.get("text") or event.get("bytes").decode("utf-8")
            )

            self.assertEqual(payload["type"], "history")
            self.assertEqual(payload["messages"], [])

            await communicator.send_input({
                "type": "websocket.disconnect",
                "code": 1000,
            })
            await communicator.wait()

        async_to_sync(run)()

    def test_unauthenticated_user_cannot_connect(self):
        async def run():
            communicator = self._websocket_communicator(
                AnonymousUser(),
                self.customer_membership.pk,
            )

            await communicator.send_input({
                "type": "websocket.connect",
            })
            response = await communicator.receive_output()

            self.assertEqual(response["type"], "websocket.close")
            self.assertEqual(response["code"], 4401)

            await communicator.wait()

        async_to_sync(run)()

    def test_user_without_eligible_membership_cannot_connect(self):
        async def run():
            communicator = self._websocket_communicator(
                self.new_consultant_user,
                self.new_consultant_membership.pk,
            )

            await communicator.send_input({
                "type": "websocket.connect",
            })
            response = await communicator.receive_output()

            self.assertEqual(response["type"], "websocket.close")
            self.assertEqual(response["code"], 4403)

            await communicator.wait()

        async_to_sync(run)()

    def test_websocket_message_is_broadcast_to_conversation_participants(self):
        sync_conversation_participants(
            self.conversation,
            added_by=self.operations_user,
        )

        encoded_key = base64.urlsafe_b64encode(
            b"K" * 32
        ).decode("ascii").rstrip("=")

        async def run():
            customer = self._websocket_communicator(
                self.customer_user,
                self.customer_membership.pk,
            )
            consultant = self._websocket_communicator(
                self.consultant_user,
                self.consultant_membership.pk,
            )

            for communicator in (customer, consultant):
                await communicator.send_input({
                    "type": "websocket.connect",
                })
                response = await communicator.receive_output()
                self.assertEqual(response["type"], "websocket.accept")

                history_event = await communicator.receive_output()
                history = json.loads(
                    history_event.get("text")
                    or history_event.get("bytes").decode("utf-8")
                )
                self.assertEqual(history["type"], "history")
                self.assertEqual(history["messages"], [])

            await customer.send_input({
                "type": "websocket.receive",
                "text": json.dumps({
                    "message": "پیام آزمایشی از طریق وب‌سوکت",
                }),
            })

            customer_event = await customer.receive_output()
            consultant_event = await consultant.receive_output()

            customer_payload = json.loads(
                customer_event.get("text")
                or customer_event.get("bytes").decode("utf-8")
            )
            consultant_payload = json.loads(
                consultant_event.get("text")
                or consultant_event.get("bytes").decode("utf-8")
            )

            for payload in (customer_payload, consultant_payload):
                self.assertEqual(payload["type"], "message")
                self.assertEqual(
                    payload["message"]["text"],
                    "پیام آزمایشی از طریق وب‌سوکت",
                )
                self.assertEqual(
                    payload["message"]["sender_membership_id"],
                    self.customer_membership.pk,
                )

            for communicator in (customer, consultant):
                await communicator.send_input({
                    "type": "websocket.disconnect",
                    "code": 1000,
                })
                await communicator.wait()

        with patch.dict(
            os.environ,
            {"FEEMAAS_CHAT_ENCRYPTION_KEY_V1": encoded_key},
        ):
            async_to_sync(run)()

            message = Message.objects.get(
                conversation=self.conversation,
            )
            self.assertNotIn(
                "پیام آزمایشی از طریق وب‌سوکت".encode("utf-8"),
                message.ciphertext,
            )
            self.assertEqual(
                decrypt_chat_message(message),
                "پیام آزمایشی از طریق وب‌سوکت",
            )

    def test_websocket_cannot_send_message_after_project_completion(self):
        sync_conversation_participants(
            self.conversation,
            added_by=self.operations_user,
        )

        self.project.status = "completed"
        self.project.save(update_fields=["status"])

        async def run():
            communicator = self._websocket_communicator(
                self.customer_user,
                self.customer_membership.pk,
            )

            await communicator.send_input({
                "type": "websocket.connect",
            })
            response = await communicator.receive_output()
            self.assertEqual(response["type"], "websocket.accept")

            history_event = await communicator.receive_output()
            history = json.loads(
                history_event.get("text")
                or history_event.get("bytes").decode("utf-8")
            )
            self.assertEqual(history["type"], "history")

            await communicator.send_input({
                "type": "websocket.receive",
                "text": json.dumps({
                    "message": "این پیام نباید ذخیره شود",
                }),
            })

            error_event = await communicator.receive_output()
            error_payload = json.loads(
                error_event.get("text")
                or error_event.get("bytes").decode("utf-8")
            )

            self.assertEqual(error_payload["type"], "error")
            self.assertIn("disabled", error_payload["message"])

            await communicator.send_input({
                "type": "websocket.disconnect",
                "code": 1000,
            })
            await communicator.wait()

        async_to_sync(run)()

        self.assertEqual(
            Message.objects.filter(
                conversation=self.conversation,
            ).count(),
            0,
        )



    def test_reassignment_closes_old_socket_and_preserves_other_access(self):
        sync_conversation_participants(
            self.conversation,
            added_by=self.operations_user,
        )

        async def run():
            customer = self._websocket_communicator(
                self.customer_user,
                self.customer_membership.pk,
            )
            old_consultant = self._websocket_communicator(
                self.consultant_user,
                self.consultant_membership.pk,
            )

            for communicator in (customer, old_consultant):
                await communicator.send_input({
                    "type": "websocket.connect",
                })
                response = await communicator.receive_output()
                self.assertEqual(response["type"], "websocket.accept")
                history_event = await communicator.receive_output()
                payload = json.loads(
                    history_event.get("text")
                    or history_event.get("bytes").decode("utf-8")
                )
                self.assertEqual(payload["type"], "history")

            new_assignment, changed = await sync_to_async(
                reassign_project_consultant
            )(
                self.project,
                self.new_consultant_membership,
                self.operations_user,
            )
            self.assertTrue(changed)
            self.assertEqual(
                new_assignment.membership_id,
                self.new_consultant_membership.pk,
            )

            await sync_to_async(refresh_project_chat_access)(
                self.project.pk,
                added_by=self.operations_user,
            )

            old_close = await old_consultant.receive_output()
            self.assertEqual(old_close["type"], "websocket.close")
            self.assertEqual(old_close["code"], 4403)
            await old_consultant.wait()

            self.assertTrue(
                await customer.receive_nothing(timeout=0.1)
            )

            new_consultant = self._websocket_communicator(
                self.new_consultant_user,
                self.new_consultant_membership.pk,
            )
            await new_consultant.send_input({
                "type": "websocket.connect",
            })
            response = await new_consultant.receive_output()
            self.assertEqual(response["type"], "websocket.accept")

            history_event = await new_consultant.receive_output()
            history = json.loads(
                history_event.get("text")
                or history_event.get("bytes").decode("utf-8")
            )
            self.assertEqual(history["type"], "history")

            self.assertTrue(
                await customer.receive_nothing(timeout=0.1)
            )

            for communicator in (customer, new_consultant):
                await communicator.send_input({
                    "type": "websocket.disconnect",
                    "code": 1000,
                })
                await communicator.wait()

        async_to_sync(run)()

        old_participant = ConversationParticipant.objects.get(
            conversation=self.conversation,
            membership=self.consultant_membership,
        )
        new_participant = ConversationParticipant.objects.get(
            conversation=self.conversation,
            membership=self.new_consultant_membership,
        )
        self.assertEqual(old_participant.status, "removed")
        self.assertEqual(new_participant.status, "active")

    def _api_client_for_membership(self, membership):
        client = APIClient()
        self.assertTrue(
            client.login(
                username=membership.user.username,
                password="test-password",
            )
        )
        session = client.session
        session[ACTIVE_MEMBERSHIP_SESSION_KEY] = membership.pk
        session.save()
        return client

    def test_project_conversation_api_requires_active_membership(self):
        client = APIClient()
        self.assertTrue(
            client.login(
                username=self.customer_user.username,
                password="test-password",
            )
        )

        response = client.get(
            "/api/chat/projects/{}/".format(self.project.pk)
        )

        self.assertEqual(response.status_code, 403)

    def test_project_conversation_api_rejects_ineligible_membership_without_creating_conversation(self):
        self.conversation.delete()
        client = self._api_client_for_membership(
            self.pending_workshop_membership
        )

        response = client.get(
            "/api/chat/projects/{}/".format(self.project.pk)
        )

        self.assertEqual(response.status_code, 403)
        self.assertFalse(
            Conversation.objects.filter(project=self.project).exists()
        )

    def test_project_conversation_api_returns_conversation_for_eligible_membership(self):
        self.conversation.delete()
        client = self._api_client_for_membership(
            self.customer_membership
        )

        response = client.get(
            "/api/chat/projects/{}/".format(self.project.pk)
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        conversation = Conversation.objects.get(project=self.project)
        self.assertEqual(payload["conversation_id"], conversation.pk)
        self.assertEqual(payload["membership_id"], self.customer_membership.pk)
        self.assertEqual(payload["project_id"], self.project.pk)
        self.assertEqual(payload["project_status"], "consulting")
        self.assertTrue(payload["can_send"])
        self.assertEqual(payload["max_message_length"], 10000)
        self.assertEqual(
            payload["websocket_url"],
            "/ws/chat/{}/?membership_id={}".format(
                conversation.pk,
                self.customer_membership.pk,
            ),
        )
