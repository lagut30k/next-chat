'use client';
import { Suspense, use, useEffect, useState } from 'react';

export const WakeLock = () => {
  const [isLocked, setIsLocked] = useState(false);
  useEffect(() => {
    const lock = navigator.wakeLock.request('screen');
    lock.then((l) => {
      console.log('WakeLock acquired');
      setIsLocked(true);
      l.addEventListener('release', (e) => {
        console.log('WakeLock released', e);
        setIsLocked(false);
      });
    });
    return () => {
      lock.then((l) => l.release());
    };
  }, []);
  return null;
};

export const SocketComponent = ({
  roomId,
  id,
}: {
  roomId: string;
  id: Promise<string>;
}) => {
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3000/api/rooms/${roomId}/chat`);
    ws.onopen = () => {
      console.log('Connected to WebSocket');
      ws.send('Hello, WebSocket!');
    };
    ws.onmessage = (event) => {
      console.log('Message received:', event.data);
    };
    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
    return () => {
      ws.close();
    };
  }, [roomId]);
  return (
    <Suspense key={roomId} fallback={<div>Loading (socketComponent)...</div>}>
      <Inner id={id} />
    </Suspense>
  );
};

function Inner({ id }: { id: Promise<string> }) {
  return <div>WebSocket Example {use(id)}</div>;
}

type Message = {
  id: string;
  content: string;
  author: string;
};

function useRoomChat({ roomId }: { roomId: string }) {
  const messages = useState<Message[]>([]);
  const [connection] = useState(new WebSocket('ws://localhost:3000'));
  return { messages };
}
