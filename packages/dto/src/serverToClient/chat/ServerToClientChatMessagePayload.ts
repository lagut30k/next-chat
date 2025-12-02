import { z } from 'zod';
import { ChatMessageContent } from '../../shared/chat/ChatMessageContent.js';

export const UserPublicData = z.object({
  id: z.uuid(),
  nickName: z.string(),
});

export type UserPublicData = z.infer<typeof UserPublicData>;

const Author = z.discriminatedUnion('type', [
  z.object({ type: z.literal('user'), user: UserPublicData }),
  z.object({ type: z.literal('system') }),
]);

export const ChatMessagePayload = z.object({
  id: z.uuid(),
  content: ChatMessageContent,
  author: Author,
});
export type ChatMessagePayload = z.infer<typeof ChatMessagePayload>;
