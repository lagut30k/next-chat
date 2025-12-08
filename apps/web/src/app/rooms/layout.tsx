import React, { Suspense } from 'react';

import { RoomsList } from '@/components/roomsList';

export default function RoomsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 flex-1">
      <menu className="w-[300px] shrink-0 p-4 border-r border-gray-200">
        <Suspense fallback={<div>Loading...</div>}>
          <RoomsList />
        </Suspense>
      </menu>
      <main className="flex-1 min-w-0 p-4 h-full">
        <Suspense fallback={<div>Loading (room layout)...</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
