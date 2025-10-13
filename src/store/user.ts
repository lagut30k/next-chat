'use client';
import { create } from 'zustand';
import { generateUuid } from '@/utils/generateUuid';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface UserIdStore {
  userId: string;
  setUser: (userId: string) => void;
}

export const useUserIdStore = create<UserIdStore>()(
  persist(
    (set) => ({
      userId: '',
      setUser: (userId) => set({ userId }),
    }),
    {
      name: 'userId',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);

if (!useUserIdStore.getState().userId) {
  useUserIdStore.setState(() => ({ userId: generateUuid() }));
}
