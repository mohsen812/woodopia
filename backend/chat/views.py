from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from projects.models import Project
from workspace.services import get_active_membership

from .services import (
    MAX_MESSAGE_LENGTH,
    can_send_project_message,
    get_eligible_memberships,
    get_or_create_conversation,
)


class ProjectConversationView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):
        membership = get_active_membership(request)

        if membership is None:
            return Response(
                {"detail": "No active workspace membership."},
                status=status.HTTP_403_FORBIDDEN,
            )

        project = get_object_or_404(
            Project.objects.all(),
            pk=project_id,
        )

        if not get_eligible_memberships(project).filter(
            pk=membership.pk
        ).exists():
            return Response(
                {"detail": "You do not have access to this conversation."},
                status=status.HTTP_403_FORBIDDEN,
            )

        conversation, _ = get_or_create_conversation(
            project,
            created_by=request.user,
        )

        return Response({
            "conversation_id": conversation.pk,
            "membership_id": membership.pk,
            "project_id": project.pk,
            "project_status": project.status,
            "can_send": can_send_project_message(project),
            "max_message_length": MAX_MESSAGE_LENGTH,
            "websocket_url": (
                "/ws/chat/{}/?membership_id={}".format(
                    conversation.pk,
                    membership.pk,
                )
            ),
        })
