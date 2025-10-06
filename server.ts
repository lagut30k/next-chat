import next from 'next';
import { parse } from 'url';
import { createServer, IncomingMessage } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import { Socket } from 'node:net';
// import { sharedState } from './src/lib/sharedState';
import { sharedState } from '@/lib/sharedState';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
app.prepare().then(() => {
  const server = createServer((res, req) => {
    const parsedUrl = parse(res.url!, true);
    // noinspection JSIgnoredPromiseFromCall
    handle(res, req, parsedUrl);
  }).listen(port);

  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws: WebSocket) => {
    // clients.add(ws);
    console.log('New client connected');

    ws.send('Hello, client!');
    ws.send(JSON.stringify(sharedState.seed), { binary: false });
    const upgradeHandler = app.getUpgradeHandler();
    ws.on('message', (message: Buffer, isBinary: boolean) => {
      console.log(`Message received: ${message}`);
      wss.clients.forEach((client) => {
        if (
          client.readyState === WebSocket.OPEN &&
          message.toString() !== `{"event":"ping"}`
        ) {
          client.send(message, { binary: isBinary });
        }
      });
    });

    ws.on('close', () => {
      wss.clients.delete(ws);
      console.log('Client disconnected');
    });
  });

  server.on('upgrade', (req: IncomingMessage, socket: Socket, head: Buffer) => {
    const { pathname } = parse(req.url || '/', true);

    if (pathname === '/_next/webpack-hmr') {
      app.getUpgradeHandler()(req, socket, head);
    }

    if (pathname === '/api/ws') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    }
  });
  //

  console.log(
    `> Server listening at http://localhost:${port} as ${
      dev ? 'development' : process.env.NODE_ENV
    }`,
  );
});
