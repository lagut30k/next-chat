import { z } from 'zod';
import { PingPayload } from '../../shared/service/PingPayload.js';

export const UserAuthenticationRequestPayload = z.object({
  type: z.literal('user-authentication-request'),
});

export const ServerToClientServiceMessagePayload = z.discriminatedUnion(
  'type',
  [UserAuthenticationRequestPayload, PingPayload],
);
