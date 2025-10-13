import React, { Suspense } from 'react';
import Link from 'next/link';

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

async function RoomsList() {
  // await new Promise((resolve) => setTimeout(resolve, 10000));
  return (
    <>
      <h1 className="text-lg font-semibold">Rooms</h1>
      <ul className="mt-4 flex flex-col gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, '<cra>'].map((item) => (
          <li key={item}>
            <Link
              href={`/rooms/${item}`}
              // href={`/rooms/${encodeURIComponent(item)}`}
              className="block rounded px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              Room {item}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
