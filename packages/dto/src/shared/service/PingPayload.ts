import { z } from 'zod';

export const PingPayload = z.object({ type: z.literal('ping') });
export type PingPayload = z.infer<typeof PingPayload>;
