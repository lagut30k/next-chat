import { createServer, IncomingMessage } from 'node:http';
import { Socket } from 'node:net';
import wss from './webSocketServer.js';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';

const server = createServer().listen(port);

server.on('upgrade', (req: IncomingMessage, socket: Socket, head: Buffer) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});
//

console.log(
  `> Server listening at http://localhost:${port} as ${
    dev ? 'development' : process.env.NODE_ENV
  }`,
);
