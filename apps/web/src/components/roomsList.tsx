import { db } from '@chat-next/database/client';
import Link from 'next/link';
import React from 'react';

export async function RoomsList() {
  const rooms = await db.query.roomsTable.findMany({
    columns: {
      id: true,
      name: true,
      createdAt: true,
      slug: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  return (
    <>
      <h1 className="text-lg font-semibold">Rooms</h1>
      <ul className="mt-4 flex flex-col gap-1">
        {rooms.map((room) => (
          <li key={room.id}>
            <Link
              href={`/rooms/${encodeURIComponent(room.slug)}`}
              className="block rounded px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              Room {room.name}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        className="block rounded px-3 py-2 text-gray-300 hover:text-gray-900 hover:bg-gray-100"
        href="/rooms/create"
      >
        Create New +
      </Link>
    </>
  );
}
