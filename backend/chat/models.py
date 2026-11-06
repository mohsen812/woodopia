from django.conf import settings
from django.db import models
import uuid


class Conversation(models.Model):
    project = models.OneToOneField(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="chat_conversation",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_chat_conversations",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"Conversation for project {self.project_id}"


class ConversationParticipant(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("removed", "Removed"),
    ]

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="participants",
    )
    membership = models.ForeignKey(
        "organizations.Membership",
        on_delete=models.PROTECT,
        related_name="chat_participations",
    )
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="active",
    )
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="added_chat_participants",
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    left_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["joined_at", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["conversation", "membership"],
                name="chat_unique_conversation_membership",
            ),
        ]
        indexes = [
            models.Index(
                fields=["membership", "status"],
                name="chat_part_mem_status_idx",
            ),
        ]

    def __str__(self):
        return f"Participant {self.membership_id} in conversation {self.conversation_id}"


class Message(models.Model):
    message_uuid = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
    )
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        ConversationParticipant,
        on_delete=models.PROTECT,
        related_name="messages",
    )
    ciphertext = models.BinaryField()
    nonce = models.BinaryField(max_length=12)
    key_version = models.PositiveSmallIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at", "id"]
        indexes = [
            models.Index(
                fields=["conversation", "created_at"],
                name="chat_msg_conv_created_idx",
            ),
        ]

    def __str__(self):
        return f"Encrypted message {self.pk} in conversation {self.conversation_id}"
