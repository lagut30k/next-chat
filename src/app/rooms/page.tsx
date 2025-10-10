'use client';
import { seed } from '@/socketLib/testIsolation';
import { Room } from '@/components/room';
import { useState } from 'react';

export default function LobbyPage() {
  const t = seed;
  const [roomId, setRoomId] = useState('1');
  return (
    <div className="flex flex-col min-w-0 p-4">
      <h1>Lobby</h1>
      Lobby... select the room
      <input
        type="text"
        defaultValue={roomId}
        onBlur={(e) => setRoomId(e.target.value)}
        className="flex-1 px-4 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <Room roomId={roomId} />
    </div>
  );
}
