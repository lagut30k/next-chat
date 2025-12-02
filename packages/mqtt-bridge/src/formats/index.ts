import { z } from 'zod';

export const roomIdFormat = z.stringFormat('roomId', /^[a-zA-Z0-9]+$/);
