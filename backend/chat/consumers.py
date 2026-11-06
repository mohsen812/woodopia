from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from organizations.models import Membership

from .models import Conversation, ConversationParticipant
from .services import (
    get_eligible_memberships,
    get_decrypted_messages,
    send_message,
    sync_conversation_participants,
)


@database_sync_to_async
def load_chat_connection(user_id, conversation_id, membership_id):
    conversation = Conversation.objects.select_related("project").get(
        pk=conversation_id
    )
    membership = Membership.objects.select_related(
        "organization", "role_fk", "user"
    ).get(
        pk=membership_id,
        user_id=user_id,
        status="active",
    )

    sync_conversation_participants(conversation)

    participant = ConversationParticipant.objects.filter(
        conversation=conversation,
        membership=membership,
        status="active",
    ).exists()

    eligible = get_eligible_memberships(
        conversation.project
    ).filter(pk=membership.pk).exists()

    if not participant or not eligible:
        return None

    messages = get_decrypted_messages(
        conversation,
        membership,
        limit=50,
    )

    history = []
    for message in messages:
        user = message.sender.membership.user
        history.append({
            "id": message.pk,
            "uuid": str(message.message_uuid),
            "text": message.plaintext,
            "sender_membership_id": message.sender.membership_id,
            "sender_name": user.get_full_name() or user.get_username(),
            "created_at": message.created_at.isoformat(),
        })

    return {
        "conversation_id": conversation.pk,
        "membership_id": membership.pk,
        "history": history,
    }


@database_sync_to_async
def persist_chat_message(user_id, conversation_id, membership_id, text):
    conversation = Conversation.objects.select_related("project").get(
        pk=conversation_id
    )
    membership = Membership.objects.get(
        pk=membership_id,
        user_id=user_id,
        status="active",
    )

    message = send_message(conversation, membership, text)
    user = message.sender.membership.user

    return {
        "id": message.pk,
        "uuid": str(message.message_uuid),
        "text": text.strip(),
        "sender_membership_id": message.sender.membership_id,
        "sender_name": user.get_full_name() or user.get_username(),
        "created_at": message.created_at.isoformat(),
    }


@database_sync_to_async
def has_chat_access(user_id, conversation_id, membership_id):
    conversation = Conversation.objects.select_related("project").get(
        pk=conversation_id
    )

    participant_active = ConversationParticipant.objects.filter(
        conversation=conversation,
        membership_id=membership_id,
        membership__user_id=user_id,
        membership__status="active",
        status="active",
    ).exists()

    eligible = get_eligible_memberships(
        conversation.project
    ).filter(pk=membership_id).exists()

    return participant_active and eligible


class ProjectChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")

        if not user or not user.is_authenticated:
            await self.close(code=4401)
            return

        query = parse_qs(
            self.scope.get("query_string", b"").decode("utf-8")
        )

        try:
            membership_id = int(
                query.get("membership_id", [""])[0]
            )
            conversation_id = int(
                self.scope["url_route"]["kwargs"]["conversation_id"]
            )
        except (TypeError, ValueError, KeyError, IndexError):
            await self.close(code=4400)
            return

        try:
            connection = await load_chat_connection(
                user.pk,
                conversation_id,
                membership_id,
            )
        except (Conversation.DoesNotExist, Membership.DoesNotExist):
            await self.close(code=4403)
            return

        if connection is None:
            await self.close(code=4403)
            return

        self.user_id = user.pk
        self.conversation_id = connection["conversation_id"]
        self.membership_id = connection["membership_id"]
        self.group_name = "project_chat_{}".format(
            self.conversation_id
        )

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name,
        )
        await self.accept()

        await self.send_json({
            "type": "history",
            "messages": connection["history"],
        })

    async def disconnect(self, close_code):
        group_name = getattr(self, "group_name", None)

        if group_name:
            await self.channel_layer.group_discard(
                group_name,
                self.channel_name,
            )

    async def receive_json(self, content, **kwargs):
        if not isinstance(content, dict):
            await self.send_json({
                "type": "error",
                "message": "Invalid payload.",
            })
            return

        text = content.get("message")

        if not isinstance(text, str):
            await self.send_json({
                "type": "error",
                "message": "Message must be text.",
            })
            return

        try:
            message = await persist_chat_message(
                self.user_id,
                self.conversation_id,
                self.membership_id,
                text,
            )
        except (PermissionError, ValueError, TypeError) as exc:
            await self.send_json({
                "type": "error",
                "message": str(exc),
            })
            return
        except (Conversation.DoesNotExist, Membership.DoesNotExist):
            await self.close(code=4403)
            return

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "chat.message",
                "message": message,
            },
        )

    async def chat_message(self, event):
        allowed = await has_chat_access(
            self.user_id,
            self.conversation_id,
            self.membership_id,
        )

        if not allowed:
            await self.close(code=4403)
            return

        await self.send_json({
            "type": "message",
            "message": event["message"],
        })

    async def chat_access_revoked(self, event):
        allowed = await has_chat_access(
            self.user_id,
            self.conversation_id,
            self.membership_id,
        )

        if not allowed:
            await self.close(code=4403)
