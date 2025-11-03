"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAuthenticationDataJsonCodec = exports.ClientToServerChatMessageJsonCodec = exports.ChatMessageJsonCodec = exports.ClientToServerChatMessage = exports.ChatMessage = exports.UserAuthenticationData = exports.UserPublicData = exports.ChatMessageContent = void 0;
const zod_1 = require("zod");
exports.ChatMessageContent = zod_1.z.string();
exports.UserPublicData = zod_1.z.object({
    id: zod_1.z.uuid(),
    nickName: zod_1.z.string(),
});
exports.UserAuthenticationData = zod_1.z.object({
    userId: zod_1.z.uuid(),
    nickName: zod_1.z.string(),
});
exports.ChatMessage = zod_1.z.object({
    id: zod_1.z.uuid(),
    content: exports.ChatMessageContent,
    author: exports.UserPublicData,
});
exports.ClientToServerChatMessage = zod_1.z.object({
    content: exports.ChatMessageContent,
});
const jsonCodec = (schema) => zod_1.z.codec(zod_1.z.string(), schema, {
    decode: (jsonString, ctx) => {
        try {
            return JSON.parse(jsonString);
        }
        catch (err) {
            ctx.issues.push({
                code: 'invalid_format',
                format: 'json',
                input: jsonString,
                // eslint-disable-next-line
                message: err === null || err === void 0 ? void 0 : err.message,
            });
            return zod_1.z.NEVER;
        }
    },
    encode: (value) => JSON.stringify(value),
});
exports.ChatMessageJsonCodec = jsonCodec(exports.ChatMessage);
exports.ClientToServerChatMessageJsonCodec = jsonCodec(exports.ClientToServerChatMessage);
exports.UserAuthenticationDataJsonCodec = jsonCodec(exports.UserAuthenticationData);
