"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const sharedState_1 = require("../socketLib/sharedState");
const node_timers_1 = require("node:timers");
const wss = new ws_1.WebSocketServer({ noServer: true });
const connectedSockets = new Map();
function addSocket(path, ws) {
    var _a;
    if (!connectedSockets.has(path)) {
        connectedSockets.set(path, new Set());
    }
    (_a = connectedSockets.get(path)) === null || _a === void 0 ? void 0 : _a.add(ws);
}
function removeSocket(path, ws) {
    const pathSockets = connectedSockets.get(path);
    if (!pathSockets) {
        return;
    }
    pathSockets.delete(ws);
    if (pathSockets.size === 0) {
        connectedSockets.delete(path);
    }
}
function getSockets(path) {
    var _a;
    return (_a = connectedSockets.get(path)) !== null && _a !== void 0 ? _a : new Set();
}
wss.on('connection', (ws, request) => {
    var _a, _b;
    console.log('New client connected');
    console.log('request.url', request.url);
    const url = URL.parse((_a = request.url) !== null && _a !== void 0 ? _a : '', 'http://fake.domain/');
    const path = (_b = url === null || url === void 0 ? void 0 : url.pathname) !== null && _b !== void 0 ? _b : '';
    console.log('path:', path);
    addSocket(path, ws);
    const pingInterval = setInterval(() => ws.ping(), 10000);
    ws.send('1Hello, client!', { binary: true });
    ws.send('2Hello, client!', { binary: true });
    ws.send('3Hello, client!', { binary: true });
    ws.send('4Hello, client!');
    ws.send(JSON.stringify(sharedState_1.sharedState.seed), { binary: false });
    ws.on('message', (message, isBinary) => {
        console.log(`Message received: ${message}`);
        getSockets(path).forEach((client) => {
            if (client.readyState === ws_1.WebSocket.OPEN &&
                message.toString() !== `{"event":"ping"}`) {
                client.send(message, { binary: isBinary });
            }
        });
    });
    ws.on('close', (event) => {
        removeSocket(path, ws);
        (0, node_timers_1.clearInterval)(pingInterval);
        console.log('Client disconnected', event);
    });
});
exports.default = wss;
