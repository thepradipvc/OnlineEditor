import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
import random

class shareCodeConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_code'] if 'room_code' in self.scope['url_route']['kwargs'].keys() else random.randint(100000,999999)
        self.room_group_name = 'room_%s' % self.room_name

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        await self.send(text_data=json.dumps({
            "room_name": self.room_name
        }))

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name,
        )

    async def receive(self, text_data):
        """
        Receive message from WebSocket.
        Get the event and send the appropriate event
        """
        response = json.loads(text_data)
        url = response.get("codeUrl", None)
        sharer = response.get("sharer", None)
        # Send message to room group
        await self.channel_layer.group_send(self.room_group_name, {
            'type': 'send_message',
            'sender_channel_name': self.channel_name,
            'url': url,
            'sharer': sharer
        })

    async def send_message(self, res):
        """ Receive message from room group """
        # Send message to WebSocket
        if self.channel_name != res['sender_channel_name']:
            await self.send(text_data=json.dumps({
                "codeUrl": res["url"],
                "sharer": res["sharer"]
            }))