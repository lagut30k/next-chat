import { WebSocket as WsWebSocket, WebSocketServer } from 'ws';
import * as http from 'node:http';
import { clearInterval } from 'node:timers';
import { generateUuid } from '@/utils/generateUuid';
import {
  ChatMessage,
  ChatMessageJsonCodec,
  ClientToServerChatMessageJsonCodec,
  UserAuthenticationDataJsonCodec,
  UserPublicData,
} from '@/dto/ChatMessage';

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

function addSocket(path: string, ws: WebSocket) {
  if (!connectedSockets.has(path)) {
    connectedSockets.set(path, new Set<WebSocket>());
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
