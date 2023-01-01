from django.urls import re_path, path
from .consumers import shareCodeConsumer

websocket_urlpatterns = [
    path("ws/create", shareCodeConsumer.as_asgi()),
    path("ws/join/<int:room_code>", shareCodeConsumer.as_asgi())
]