import { ChatMessagePayload } from './chat/ServerToClientChatMessagePayload.js';
import { ServerToClientServiceMessagePayload } from './service/ServerToClientServiceMessagePayload.js';
import { z } from 'zod';
import { jsonCodec } from '../jsonCodec.js';

export const ServerToClientMessage = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('chat'),
    payload: ChatMessagePayload,
  }),
  z.object({
    type: z.literal('service'),
    payload: ServerToClientServiceMessagePayload,
  }),
]);

export type ServerToClientMessage = z.infer<typeof ServerToClientMessage>;

export const ServerToClientJsonCodec = jsonCodec(ServerToClientMessage);
