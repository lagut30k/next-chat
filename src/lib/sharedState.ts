import { seed } from '@/lib/testIsolation';

type SharedState = {
  onlineUsers: Set<string>;
  seed: number[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;

if (!g.__SHARED_STATE__) {
  g.__SHARED_STATE__ = {
    onlineUsers: new Set<string>(),
    seed: seed,
  } as SharedState;
}

export const sharedState: SharedState = g.__SHARED_STATE__;
