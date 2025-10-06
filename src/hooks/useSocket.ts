import {
  Suspense,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { writer } from 'node:repl';
import { OPEN } from 'ws';

let i = 1;
export function useSocket({
  roomId,
  id,
}: {
  roomId: string;
  id: Promise<string>;
}) {
  const transformStream = useMemo(() => {
    const t = new TransformStream({});
    // @ts-expect-error debug
    t.x = i;
    console.log('init transform stream', i);
    i++;
    return t;
  }, []);
  const writerRef = useRef<WritableStreamDefaultWriter>(null);
  useEffect(() => {
    console.log(
      'transformStream.readable === transformStream.readable',
      transformStream.readable === transformStream.readable,
    );
    const writer = transformStream.writable.getWriter();
    writerRef.current = writer;
    return () => {
      writer.releaseLock();
    };
  }, [transformStream]);
  const writer1 = writerRef.current!;

  const wsRef = useRef<WebSocket>(null);
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3000/ws/rooms/${roomId}`);
    wsRef.current = ws;
    ws.onopen = () => {
      console.log('Connected to WebSocket');
      ws.send('Hello, WebSocket!');
    };
    ws.onmessage = (event) => {
      console.log('Message received:', event.data);
      void writerRef.current!.write(event.data);
    };
    ws.onerror = (event) => {
      console.error('WebSocket error:', event);

      console.error(event);
    };
    ws.onclose = (event) => {
      console.log('WebSocket connection closed', event);
    };
    return () => {
      console.log('Cleaning up WebSocket connection');

      if (ws.readyState === ws.OPEN) {
        ws.close(1000, 'Cleaning up WebSocket connection');
      }
      if (ws.readyState === ws.CONNECTING) {
        ws.onopen = () => ws.close(1000, 'Cleaning up WebSocket connection');
      }
    };
  }, [roomId]);

  const sendMessage = useCallback((message: string) => {
    wsRef.current?.send(message);
  }, []);

  return {
    sendMessage,
    messageStream: transformStream.readable,
  };
}
