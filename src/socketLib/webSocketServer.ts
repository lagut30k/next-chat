import { WebSocketServer, WebSocket } from 'ws';
import { sharedState } from '@/socketLib/sharedState';
import * as http from 'node:http';
import { clearInterval } from 'node:timers';

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

wss.on('connection', (ws: WebSocket, request: http.IncomingMessage) => {
  console.log('New client connected');
  console.log('request.url', request.url);
  const url = URL.parse(request.url ?? '', 'http://fake.domain/');
  const path = url?.pathname ?? '';

  console.log('path:', path);
  addSocket(path, ws);

  const pingInterval = setInterval(() => ws.ping(), 10_000);
  ws.send('1Hello, client!', { binary: true });
  ws.send('2Hello, client!', { binary: true });
  ws.send('3Hello, client!', { binary: true });
  ws.send('4Hello, client!');
  ws.send(JSON.stringify(sharedState.seed), { binary: false });

  ws.on('message', (message: Buffer, isBinary: boolean) => {
    console.log(`Message received: ${message}`);
    getSockets(path).forEach((client) => {
      if (
        client.readyState === WebSocket.OPEN &&
        message.toString() !== `{"event":"ping"}`
      ) {
        client.send(message, { binary: isBinary });
      }
    });
  });

  ws.on('close', (event) => {
    removeSocket(path, ws);
    clearInterval(pingInterval);
    console.log('Client disconnected', event);
  });
});

export default wss;
