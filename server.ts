import next from 'next';
import { parse } from 'url';
import { createServer, IncomingMessage } from 'node:http';
import { Socket } from 'node:net';
import { sharedState } from '@/socketLib/sharedState';
import wss from '@/socketLib/webSocketServer';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
app.prepare().then(() => {
  const server = createServer((res, req) => {
    const parsedUrl = parse(res.url!, true);
    void handle(res, req, parsedUrl);
  }).listen(port);

  server.on('upgrade', (req: IncomingMessage, socket: Socket, head: Buffer) => {
    const { pathname } = parse(req.url || '/', true);

    if (pathname === '/_next/webpack-hmr') {
      app.getUpgradeHandler()(req, socket, head);
    } else {
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
