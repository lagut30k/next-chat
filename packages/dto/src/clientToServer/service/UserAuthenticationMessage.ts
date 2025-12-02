import { z } from 'zod';

export const UserAuthenticationData = z.object({
  userId: z.uuid(),
  nickName: z.string(),
});

export const UserAuthenticationPayload = z.object({
  type: z.literal('user-authentication'),
  data: UserAuthenticationData,
});
export type UserAuthenticationPayload = z.infer<
  typeof UserAuthenticationPayload
>;
