import { Suspense } from 'react';

import { Room } from '@/components/room';
import { WakeLock } from '@/components/wakeLock';
import { db } from '@chat-next/database/client';
import { roomsTable } from '@chat-next/database/schema';
import { eq } from '@chat-next/database';
import Link from 'next/link';

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const slug = decodeURIComponent((await params).roomId);
  console.log(`rendering room page ${slug}`);
  db.select().from(roomsTable).where(eq(roomsTable.slug, slug));
  const room = await db.query.roomsTable.findFirst({
    where: {
      slug: slug,
    },
  });

  // TODO
  if (!room)
    return (
      <div>
        Room {slug} not found. <Link href="/">Go back</Link>
      </div>
    );

  return (
    <Suspense key={slug} fallback="Loading... (room page)">
      <Room roomId={slug} />
      <WakeLock />
    </Suspense>
  );
}
