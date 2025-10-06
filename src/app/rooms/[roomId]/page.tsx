// 'use client';
import { Suspense } from 'react';
import { SocketComponent, WakeLock } from '@/components/socketComponent';
import { delay } from '@/app/utils/delay';

import { Room } from '@/components/room';
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
      <Suspense key={roomId} fallback="Loading... (room page)">
        <Room roomId={roomId} id={t} />
        <WakeLock />
      </Suspense>
    </div>
  );
}
