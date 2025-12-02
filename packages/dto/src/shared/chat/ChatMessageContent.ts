import { z } from 'zod';

export const ChatMessageContent = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), text: z.string() }),
]);

export type ChatMessageContent = z.infer<typeof ChatMessageContent>;
