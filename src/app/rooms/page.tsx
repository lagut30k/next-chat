import { seed } from '@/lib/testIsolation';

export default async function LobbyPage() {
  'use server';
  const t = seed;
  return (
    <div>
      <h1>Lobby</h1>
      Lobby... select the room
      {seed.map((s, i) => (
        <div key={i}>{s}</div>
      ))}
    </div>
  );
}
