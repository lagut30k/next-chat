import { WebSocket, WebSocketServer } from 'ws';
import * as http from 'node:http';
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    console.log('received: %s', message);
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});

export default async function handler(
  req: http.IncomingMessage,
  res: http.ServerResponse,
) {
  console.log('hit the handler!');
  // const wss = new WebSocketServer({ noServer: true });
  wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
      console.log('received: %s', message);
      ws.send(message);
    });
  });
  // Upgrade HTTP request to WebSocket connection
  if (!res.writableEnded) {
    res.writeHead(101, {
      'Content-Type': 'text/plain',
      Connection: 'Upgrade',
      Upgrade: 'websocket',
    });
    console.log('101');
    res.end();
  }
  wss.handleUpgrade(req, req.socket, Buffer.alloc(0), function done(ws) {
    console.log('Upgrading to WebSocket');
    wss.emit('connection', ws, req);
  });
  // if (!res.writableEnded) {
  //   res.writeHead(101, {
  //     'Content-Type': 'text/plain',
  //     Connection: 'Upgrade',
  //     Upgrade: 'websocket',
  //   });
  //   res.end();
  // }
  // wss.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
  //   wss.emit('connection', ws, req);
  // });
  // return Response.json('Hello World');
}
