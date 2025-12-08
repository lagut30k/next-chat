import { WebSocket as WsWebSocket, WebSocketServer } from 'ws';
import * as http from 'node:http';
import { clearInterval } from 'node:timers';
import { generateUuid } from '@chat-next/utils/generateUuid';
import {
  publishSerialisedToRoom,
  subscribeToRoom,
  unsubscribeFromRoom,
} from '@chat-next/mqtt-bridge/mqttBridge';
import { z } from 'zod';
import { roomIdFormat } from '@chat-next/mqtt-bridge/formats/index';
import {
  ChatMessagePayload,
  UserPublicData,
} from '@chat-next/dto/serverToClient/chat/ServerToClientChatMessagePayload';
import { UserAuthenticationPayload } from '@chat-next/dto/clientToServer/service/UserAuthenticationMessage';
import { ServerToClientJsonCodec } from '@chat-next/dto/serverToClient/ServerToClientMessage';
import { ClientToServerJsonCodec } from '@chat-next/dto/clientToServer/ClientToServerMessage';
import { ChatMessageContent } from '@chat-next/dto/shared/chat/ChatMessageContent';

type Authenticated = {
  isAuthenticated: true;
  user: UserPublicData;
};

type NonAuthenticated = {
  isAuthenticated: false;
};

type WebSocket = WsWebSocket & {
  authentication: Authenticated | NonAuthenticated;
};

const wss = new WebSocketServer({ noServer: true });
const connectedSockets = new Map<string, Set<WebSocket>>();

const roomPathPrefix = '/realtime/rooms/';
const pathFormat = z.templateLiteral([roomPathPrefix, roomIdFormat]);

function pathToRoom(path: string) {
  const pathValidationResult = pathFormat.safeParse(path);
  if (!pathValidationResult.success) {
    throw new Error(`Invalid room path: ${path}`);
  }
  const room = pathValidationResult.data.substring(roomPathPrefix.length);
  return room;
}

function addSocket(path: string, ws: WebSocket) {
  if (!connectedSockets.has(path)) {
    connectedSockets.set(path, new Set<WebSocket>());
    const room = pathToRoom(path);
    // TODO: handle async
    void subscribeToRoom(room, (message) => {
      console.log('MQTT message received', message);
      const messageParseResult = ServerToClientJsonCodec.safeParse(
        message.toString(),
      );
      if (!messageParseResult.success) {
        console.error('Invalid message:', messageParseResult.error);
        return;
      }
      const messageData = messageParseResult.data;
      switch (messageData.type) {
        case 'chat': {
          const activeClients = connectedSockets.get(path);
          if (!activeClients) {
            return;
          }
          const serialisedMessage = ServerToClientJsonCodec.encode(messageData);
          for (const activeClient of activeClients) {
            if (!activeClient.authentication.isAuthenticated) {
              continue;
            }
            activeClient.send(serialisedMessage);
          }
          break;
        }
        case 'service':
          console.warn(
            'Unexpected service message received through MQTT multicast',
            messageData.payload,
          );
      }
    });
  }
  connectedSockets.get(path)?.add(ws);
}

function removeSocket(path: string, ws: WebSocket) {
  const pathSockets = connectedSockets.get(path);
  if (!pathSockets) {
    return;
  }
  pathSockets.delete(ws);
  if (pathSockets.size === 0) {
    connectedSockets.delete(path);
    const room = pathToRoom(path);
    void unsubscribeFromRoom(room);
  }
}

function getSockets(path: string) {
  return connectedSockets.get(path) ?? new Set<WebSocket>();
}

function sendChatMessage(ws: WebSocket, message: ChatMessagePayload) {
  const serverToClientMessage = { type: 'chat' as const, payload: message };
  ws.send(ServerToClientJsonCodec.encode(serverToClientMessage));
}

function sendChatServerMessage(ws: WebSocket, message: string) {
  return sendChatMessage(ws, {
    id: generateUuid(),
    content: {
      type: 'text',
      text: message,
    },
    author: {
      type: 'system',
    },
  });
}

function authenticate(
  ws: WebSocket,
  userAuthenticationPayload: UserAuthenticationPayload,
) {
  const userData = userAuthenticationPayload.data;
  ws.authentication = {
    isAuthenticated: true,
    user: {
      id: userData.userId,
      nickName: userData.nickName,
    },
  };
  sendChatServerMessage(
    ws,
    `Thank you for authenticating, ${userData.nickName}!`,
  );
}

function forwardChatMessageToMessageQueue(
  room: string,
  messageContent: ChatMessageContent,
  user: UserPublicData,
) {
  const chatMessage: ChatMessagePayload = {
    id: generateUuid(),
    content: messageContent,
    author: {
      type: 'user',
      user: user,
    },
  };
  const serverToClientMessage = {
    type: 'chat' as const,
    payload: chatMessage,
  };

  const serialisedChatMessage = ServerToClientJsonCodec.encode(
    serverToClientMessage,
  );
  void publishSerialisedToRoom(room, serialisedChatMessage);
}

wss.on('connection', (ws: WebSocket, request: http.IncomingMessage) => {
  // TODO
  try {
    ws.authentication = {
      isAuthenticated: false,
    };
    console.log('New client connected');
    console.log('request.url', request.url);
    const url = URL.parse(request.url ?? '', 'http://fake.domain/');
    const path = url?.pathname ?? '';

    console.log('path:', path);
    addSocket(path, ws);
    const room = pathToRoom(path);

    const pingInterval = setInterval(() => ws.ping(), 10_000);
    sendChatServerMessage(ws, 'Hello! Please authenticate');

    ws.on('message', (message: Buffer, isBinary: boolean) => {
      console.log(`WebSocket message received: ${message}`);
      if (isBinary) {
        return;
      }
      const incomingMessageParseResult = ClientToServerJsonCodec.safeParse(
        message.toString(),
      );
      if (!incomingMessageParseResult.success) {
        console.warn(
          'Received unparsable message',
          incomingMessageParseResult.error,
        );
        return;
      }
      const payload = incomingMessageParseResult.data;
      if (ws.authentication.isAuthenticated) {
        switch (payload.type) {
          case 'chat': {
            const messageContent = payload.payload;
            forwardChatMessageToMessageQueue(
              room,
              messageContent,
              ws.authentication.user,
            );
            break;
          }
          case 'service':
            break;
        }
      }

      if (!ws.authentication.isAuthenticated) {
        switch (payload.type) {
          case 'chat':
            console.error(
              'Attempt to send chat message from non-authenticated ws connection',
              {
                payload,
              },
            );
            break;
          case 'service': {
            const serviceMessagePayload = payload.payload;
            if (serviceMessagePayload.type !== 'user-authentication') {
              console.error(
                'Attempt to send service message from non-authenticated ws connection',
                {
                  payload,
                  ws,
                },
              );
              return;
            }
            authenticate(ws, serviceMessagePayload);
            break;
          }
        }
      }
    });

    ws.on('close', (event) => {
      removeSocket(path, ws);
      clearInterval(pingInterval);
      console.log('Client disconnected', event);
    });
  } catch (e) {
    console.error('Error handling WebSocket connection', e);
  }
});

wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

export default wss;
