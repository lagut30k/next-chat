import { WebSocket as WsWebSocket, WebSocketServer } from 'ws';
import * as http from 'node:http';
import { clearInterval } from 'node:timers';
import { generateUuid } from '@chat-next/utils/generateUuid';
import {
  ChatMessage,
  ChatMessageJsonCodec,
  ClientToServerChatMessageJsonCodec,
  UserAuthenticationDataJsonCodec,
  UserPublicData,
} from '@chat-next/dto/ChatMessage';
import {
  publishToRoom,
  subscribeToRoom,
  unsubscribeFromRoom,
} from './mqttBridge.js';
import { z } from 'zod';
import { roomIdFormat } from './formats/index.js';

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
      console.log('message received', message);
      const messageParseResult = ChatMessageJsonCodec.safeParse(
        message.toString(),
      );
      if (!messageParseResult.success) {
        console.error('Invalid message:', messageParseResult.error);
        return;
      }
      const messageData = messageParseResult.data;
      const serialisedMessage = ChatMessageJsonCodec.encode(messageData);
      const activeClients = connectedSockets.get(path);
      if (!activeClients) {
        return;
      }
      for (const activeClient of activeClients) {
        if (!activeClient.authentication.isAuthenticated) {
          continue;
        }
        activeClient.send(serialisedMessage);
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

const serverId = generateUuid();

wss.on('connection', (ws: WebSocket, request: http.IncomingMessage) => {
  ws.authentication = {
    isAuthenticated: false,
  };
  console.log('New client connected');
  console.log('request.url', request.url);
  const url = URL.parse(request.url ?? '', 'http://fake.domain/');
  const path = url?.pathname ?? '';

  console.log('path:', path);
  addSocket(path, ws);

  function sendChatMessage(message: ChatMessage) {
    ws.send(ChatMessageJsonCodec.encode(message));
  }
  function sendChatServerMessage(message: string) {
    return sendChatMessage({
      id: generateUuid(),
      content: message,
      author: {
        id: serverId,
        nickName: 'Server',
      },
    });
  }
  const pingInterval = setInterval(() => ws.ping(), 10_000);
  sendChatServerMessage('Hello! Please authenticate');

  function broadcastMessage(
    message: Buffer<ArrayBufferLike>,
    user: UserPublicData,
  ) {
    const incomingMessageParseResult =
      ClientToServerChatMessageJsonCodec.safeParse(message.toString());
    if (!incomingMessageParseResult.success) {
      return;
    }
    const incomingMessage = incomingMessageParseResult.data;
    const chatMessage: ChatMessage = {
      id: generateUuid(),
      content: incomingMessage.content,
      author: user,
    };

    const serialisedChatMessage = ChatMessageJsonCodec.encode(chatMessage);
    const room = pathToRoom(path);
    void publishToRoom(room, serialisedChatMessage);
    getSockets(path).forEach((client) => {
      if (
        client.readyState === WebSocket.OPEN &&
        message.toString() !== `{"event":"ping"}` &&
        client.authentication.isAuthenticated
      ) {
        client.send(serialisedChatMessage);
      }
    });
  }

  function authenticate(message: Buffer, ws: WebSocket) {
    const parseResult = UserAuthenticationDataJsonCodec.safeParse(
      message.toString(),
    );
    if (!parseResult.success) {
      return;
    }
    const userData = parseResult.data;
    ws.authentication = {
      isAuthenticated: true,
      user: {
        id: userData.userId,
        nickName: userData.nickName,
      },
    };
    sendChatServerMessage(
      `Thank you for authenticating, ${userData.nickName}!`,
    );
  }

  ws.on('message', (message: Buffer, isBinary: boolean) => {
    console.log(`Message received: ${message}`);
    if (isBinary) {
      return;
    }
    if (!ws.authentication.isAuthenticated) {
      authenticate(message, ws);
    } else {
      broadcastMessage(message, ws.authentication.user);
    }
  });

  ws.on('close', (event) => {
    removeSocket(path, ws);
    clearInterval(pingInterval);
    console.log('Client disconnected', event);
  });
});

export default wss;
