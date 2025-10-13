import { z } from 'zod';

export const ChatMessageContent = z.string();

export const ChatMessage = z.object({
  id: z.uuid(),
  content: ChatMessageContent,
  author: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessage>;

export const ClientToServerChatMessage = z.object({
  content: ChatMessageContent,
});
export type ClientToServerChatMessage = z.infer<
  typeof ClientToServerChatMessage
>;

const jsonCodec = <T extends z.core.$ZodType>(schema: T) =>
  z.codec(z.string(), schema, {
    decode: (jsonString, ctx) => {
      try {
        return JSON.parse(jsonString);
      } catch (err: unknown) {
        ctx.issues.push({
          code: 'invalid_format',
          format: 'json',
          input: jsonString,
          // eslint-disable-next-line
          message: (err as any)?.message,
        });
        return z.NEVER;
      }
    },
    encode: (value) => JSON.stringify(value),
  });

export const ChatMessageJsonCodec = jsonCodec(ChatMessage);
export const ClientToServerChatMessageJsonCodec = jsonCodec(
  ClientToServerChatMessage,
);
