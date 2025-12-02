import { z } from 'zod';
import { ChatMessageContent } from '../shared/chat/ChatMessageContent.js';
import { UserAuthenticationPayload } from './service/UserAuthenticationMessage.js';
import { jsonCodec } from '../jsonCodec.js';

export const ClientToServerMessage = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('chat'),
    payload: ChatMessageContent,
  }),
  z.object({
    type: z.literal('service'),
    payload: UserAuthenticationPayload,
  }),
]);

export type ClientToServerMessage = z.infer<typeof ClientToServerMessage>;

export const ClientToServerJsonCodec = jsonCodec(ClientToServerMessage);
