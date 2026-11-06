from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from organizations.models import Membership
from projects.models import Project, ProjectAssignment

from .crypto import CURRENT_KEY_VERSION, encrypt_message, decrypt_message
from .models import Conversation, ConversationParticipant, Message


MAX_MESSAGE_LENGTH = 10000
DEFAULT_MESSAGE_PAGE_SIZE = 50
MAX_MESSAGE_PAGE_SIZE = 100


def get_eligible_memberships(project):
    """
    Return active memberships eligible for this project's conversation.

    Eligible:
    - Active members of the customer organization.
    - The currently assigned active consultant.
    - Active workshop members whose organization accepted a tender
      belonging to this project.
    """
    return (
        Membership.objects
        .filter(
            status="active",
            organization__status="active",
        )
        .filter(
            Q(organization_id=project.customer_id)
            | Q(
                project_assignments__project=project,
                project_assignments__status="active",
                role_fk__name="consultant",
            )
            | Q(
                organization__organization_type="workshop",
                organization__tender_participations__tender__project=project,
                organization__tender_participations__response_status="accepted",
            )
        )
        .distinct()
    )


def has_active_consultant(project):
    return ProjectAssignment.objects.filter(
        project=project,
        status="active",
        membership__status="active",
        membership__role_fk__name="consultant",
        membership__organization__status="active",
    ).exists()


def can_send_project_message(project):
    return project.status in (
        "draft",
        "consulting",
        "tender",
        "production",
    )


@transaction.atomic
def sync_conversation_participants(conversation, added_by=None):
    """
    Synchronize active participants with current project eligibility.
    Historical messages and participant rows are preserved.
    """
    eligible = get_eligible_memberships(conversation.project)
    eligible_ids = list(eligible.values_list("id", flat=True))
    now = timezone.now()

    ConversationParticipant.objects.filter(
        conversation=conversation,
        status="active",
    ).exclude(
        membership_id__in=eligible_ids,
    ).update(
        status="removed",
        left_at=now,
    )

    for membership in eligible:
        participant, created = ConversationParticipant.objects.get_or_create(
            conversation=conversation,
            membership=membership,
            defaults={
                "status": "active",
                "added_by": added_by,
            },
        )

        if not created and participant.status != "active":
            participant.status = "active"
            participant.left_at = None
            participant.added_by = added_by
            participant.save(
                update_fields=["status", "left_at", "added_by"]
            )

    return conversation.participants.filter(
        status="active"
    ).select_related(
        "membership",
        "membership__user",
        "membership__organization",
        "membership__role_fk",
    )


@transaction.atomic
def get_or_create_conversation(project, created_by=None):
    conversation, created = Conversation.objects.get_or_create(
        project=project,
        defaults={"created_by": created_by},
    )

    sync_conversation_participants(
        conversation,
        added_by=created_by,
    )

    return conversation, created


def _get_active_participant(conversation, membership):
    eligible = get_eligible_memberships(
        conversation.project
    ).filter(pk=membership.pk).exists()

    if not eligible:
        raise PermissionError(
            "This membership is not eligible for this conversation."
        )

    participant = ConversationParticipant.objects.filter(
        conversation=conversation,
        membership=membership,
        status="active",
    ).first()

    if participant is None:
        raise PermissionError(
            "This membership is not an active conversation participant."
        )

    return participant


def _message_associated_data(message):
    value = (
        "feemaas-chat-v1|{}|{}|{}|{}".format(
            message.message_uuid,
            message.conversation_id,
            message.sender_id,
            message.key_version,
        )
    )
    return value.encode("utf-8")


@transaction.atomic
def send_message(conversation, membership, plaintext):
    if not isinstance(plaintext, str):
        raise TypeError("Message must be text.")

    plaintext = plaintext.strip()

    if not plaintext:
        raise ValueError("Message cannot be empty.")

    if len(plaintext) > MAX_MESSAGE_LENGTH:
        raise ValueError(
            "Message exceeds the maximum length of {} characters.".format(
                MAX_MESSAGE_LENGTH
            )
        )

    project = Project.objects.select_for_update().get(
        pk=conversation.project_id
    )
    conversation.project = project

    if not can_send_project_message(project):
        raise PermissionError(
            "Messaging is disabled for this project's current status."
        )

    participant = _get_active_participant(
        conversation,
        membership,
    )

    message = Message(
        conversation=conversation,
        sender=participant,
        key_version=CURRENT_KEY_VERSION,
    )

    associated_data = _message_associated_data(message)
    encrypted = encrypt_message(
        plaintext,
        associated_data,
    )

    message.ciphertext = encrypted["ciphertext"]
    message.nonce = encrypted["nonce"]
    message.key_version = encrypted["key_version"]
    message.save()

    conversation.save(update_fields=["updated_at"])

    return message


def decrypt_chat_message(message):
    associated_data = _message_associated_data(message)

    return decrypt_message(
        message.ciphertext,
        message.nonce,
        message.key_version,
        associated_data,
    )


def get_decrypted_messages(
    conversation,
    membership,
    before_id=None,
    limit=DEFAULT_MESSAGE_PAGE_SIZE,
):
    _get_active_participant(conversation, membership)

    try:
        limit = int(limit)
    except (TypeError, ValueError):
        limit = DEFAULT_MESSAGE_PAGE_SIZE

    limit = max(1, min(limit, MAX_MESSAGE_PAGE_SIZE))

    queryset = (
        Message.objects
        .filter(conversation=conversation)
        .select_related(
            "sender",
            "sender__membership",
            "sender__membership__user",
            "sender__membership__organization",
        )
        .order_by("-id")
    )

    if before_id is not None:
        queryset = queryset.filter(id__lt=before_id)

    messages = list(queryset[:limit])

    for message in messages:
        message.plaintext = decrypt_chat_message(message)

    messages.reverse()
    return messages


def refresh_project_chat_access(project_id, added_by=None):
    """
    Synchronize chat participants after a project access change,
    then notify connected clients to revalidate their access.
    """
    from asgiref.sync import async_to_sync
    from channels.layers import get_channel_layer

    conversation = Conversation.objects.filter(
        project_id=project_id
    ).first()

    if conversation is None:
        return False

    sync_conversation_participants(
        conversation,
        added_by=added_by,
    )

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "project_chat_{}".format(conversation.pk),
        {
            "type": "chat.access_revoked",
        },
    )

    return True
