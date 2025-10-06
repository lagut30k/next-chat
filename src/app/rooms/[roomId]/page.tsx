// 'use client';
import { Suspense, use } from 'react';
import {
  SocketComponent,
  WakeLock,
} from '@/app/rooms/[roomId]/socketComponent';
import { delay } from '@/app/utils/delay';
// import { useParams, useSearchParams } from 'next/navigation';

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  console.log('rendering room page...');
  const roomId = decodeURIComponent((await params).roomId);
  console.log(`rendering room page ${roomId}`);
  // const { roomId } = useParams<{ roomId: string }>() ?? { roomId: '1' };
  const t = delay(5000).then(() => roomId);
  return (
    <div>
      <h1>Room: {roomId} aa</h1>
      <Suspense key={roomId} fallback="Loading... (room page)">
        <SocketComponent roomId={roomId} id={t} />
        <WakeLock />
      </Suspense>
    </div>
  );
}
