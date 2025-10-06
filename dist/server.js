"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const next_1 = __importDefault(require("next"));
const url_1 = require("url");
const node_http_1 = require("node:http");
const ws_1 = require("ws");
// import { sharedState } from './src/lib/sharedState';
const sharedState_1 = require("./src/lib/sharedState");
const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = (0, next_1.default)({ dev });
const handle = app.getRequestHandler();
app.prepare().then(() => {
    const server = (0, node_http_1.createServer)((res, req) => {
        const parsedUrl = (0, url_1.parse)(res.url, true);
        // noinspection JSIgnoredPromiseFromCall
        handle(res, req, parsedUrl);
    }).listen(port);
    const wss = new ws_1.WebSocketServer({ noServer: true });
    wss.on('connection', (ws) => {
        // clients.add(ws);
        console.log('New client connected');
        ws.send('Hello, client!');
        ws.send(JSON.stringify(sharedState_1.sharedState.seed), { binary: false });
        const upgradeHandler = app.getUpgradeHandler();
        ws.on('message', (message, isBinary) => {
            console.log(`Message received: ${message}`);
            wss.clients.forEach((client) => {
                if (client.readyState === ws_1.WebSocket.OPEN &&
                    message.toString() !== `{"event":"ping"}`) {
                    client.send(message, { binary: isBinary });
                }
            });
        });
        ws.on('close', () => {
            wss.clients.delete(ws);
            console.log('Client disconnected');
        });
    });
    server.on('upgrade', (req, socket, head) => {
        const { pathname } = (0, url_1.parse)(req.url || '/', true);
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
    console.log(`> Server listening at http://localhost:${port} as ${dev ? 'development' : process.env.NODE_ENV}`);
});
