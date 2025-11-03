"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const node_timers_1 = require("node:timers");
const generateUuid_1 = require("../utils/generateUuid");
const ChatMessage_1 = require("../dto/ChatMessage");
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
const serverId = (0, generateUuid_1.generateUuid)();
wss.on('connection', (ws, request) => {
    var _a, _b;
    ws.authentication = {
        isAuthenticated: false,
    };
    console.log('New client connected');
    console.log('request.url', request.url);
    const url = URL.parse((_a = request.url) !== null && _a !== void 0 ? _a : '', 'http://fake.domain/');
    const path = (_b = url === null || url === void 0 ? void 0 : url.pathname) !== null && _b !== void 0 ? _b : '';
    console.log('path:', path);
    addSocket(path, ws);
    function sendChatMessage(message) {
        ws.send(ChatMessage_1.ChatMessageJsonCodec.encode(message));
    }
    function sendChatServerMessage(message) {
        return sendChatMessage({
            id: (0, generateUuid_1.generateUuid)(),
            content: message,
            author: {
                id: serverId,
                nickName: 'Server',
            },
        });
    }
    const pingInterval = setInterval(() => ws.ping(), 10000);
    sendChatServerMessage('Hello! Please authenticate');
    function broadcastMessage(message, user) {
        const incomingMessageParseResult = ChatMessage_1.ClientToServerChatMessageJsonCodec.safeParse(message.toString());
        if (!incomingMessageParseResult.success) {
            return;
        }
        const incomingMessage = incomingMessageParseResult.data;
        const chatMessage = {
            id: (0, generateUuid_1.generateUuid)(),
            content: incomingMessage.content,
            author: user,
        };
        const serialisedChatMessage = ChatMessage_1.ChatMessageJsonCodec.encode(chatMessage);
        getSockets(path).forEach((client) => {
            if (client.readyState === WebSocket.OPEN &&
                message.toString() !== `{"event":"ping"}` &&
                client.authentication.isAuthenticated) {
                client.send(serialisedChatMessage);
            }
        });
    }
    function authenticate(message, ws) {
        const parseResult = ChatMessage_1.UserAuthenticationDataJsonCodec.safeParse(message.toString());
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
        sendChatServerMessage(`Thank you for authenticating, ${userData.nickName}!`);
    }
    ws.on('message', (message, isBinary) => {
        console.log(`Message received: ${message}`);
        if (isBinary) {
            return;
        }
        if (!ws.authentication.isAuthenticated) {
            authenticate(message, ws);
        }
        else {
            broadcastMessage(message, ws.authentication.user);
        }
    });
    ws.on('close', (event) => {
        removeSocket(path, ws);
        (0, node_timers_1.clearInterval)(pingInterval);
        console.log('Client disconnected', event);
    });
});
exports.default = wss;
