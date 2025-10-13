"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const next_1 = __importDefault(require("next"));
const url_1 = require("url");
const node_http_1 = require("node:http");
const webSocketServer_1 = __importDefault(require("./src/socketLib/webSocketServer"));
const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = (0, next_1.default)({ dev });
const handle = app.getRequestHandler();
app.prepare().then(() => {
    const server = (0, node_http_1.createServer)((res, req) => {
        const parsedUrl = (0, url_1.parse)(res.url, true);
        void handle(res, req, parsedUrl);
    }).listen(port);
    server.on('upgrade', (req, socket, head) => {
        const { pathname } = (0, url_1.parse)(req.url || '/', true);
        if (pathname === '/_next/webpack-hmr') {
            app.getUpgradeHandler()(req, socket, head);
        }
        else {
            webSocketServer_1.default.handleUpgrade(req, socket, head, (ws) => {
                webSocketServer_1.default.emit('connection', ws, req);
            });
        }
    });
    //
    console.log(`> Server listening at http://localhost:${port} as ${dev ? 'development' : process.env.NODE_ENV}`);
});
