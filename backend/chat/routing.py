from django.urls import re_path

from .consumers import ProjectChatConsumer


websocket_urlpatterns = [
    re_path(
        r"^ws/chat/(?P<conversation_id>\d+)/$",
        ProjectChatConsumer.as_asgi(),
    ),
]
