// 'use client';
import { Suspense } from 'react';
import { delay } from '@/utils/delay';

import { Room } from '@/components/room';
import { WakeLock } from '@/components/socketComponent';
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
  const t = delay(1000).then(() => roomId);
  return (
    <Suspense key={roomId} fallback="Loading... (room page)">
      <Room roomId={roomId} />
      <WakeLock />
    </Suspense>
  );
}
