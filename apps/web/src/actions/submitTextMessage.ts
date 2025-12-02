'use server';

import { publishServerToClientMessageToRoom } from '@chat-next/mqtt-bridge/mqttBridge';
import {
  ChatMessagePayload,
  UserPublicData,
} from '@chat-next/dto/serverToClient/chat/ServerToClientChatMessagePayload';
import { generateUuid } from '@chat-next/utils/generateUuid';
import { ChatMessageContent } from '@chat-next/dto/shared/chat/ChatMessageContent';

export async function submitTextMessage(roomId: string, formData: FormData) {
  const text = formData.get('text') as string;
  const messageContent: ChatMessageContent = { type: 'text', text };
  // TODO: handle user authentication
  const user: UserPublicData = { id: generateUuid(), nickName: 'Unknown user' };
  const chatMessagePayload: ChatMessagePayload = {
    id: generateUuid(),
    content: messageContent,
    author: {
      type: 'user',
      user: user,
    },
  };
  await publishServerToClientMessageToRoom(roomId, {
    type: 'chat',
    payload: chatMessagePayload,
  });
}
