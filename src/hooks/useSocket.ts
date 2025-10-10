import { useCallback, useEffect, useMemo, useRef } from 'react';
import { AsyncQueue } from '@/utils/asyncQueue';

let j = 1;

export function useSocket(url: string) {
  const writerRef = useRef<WritableStreamDefaultWriter<string> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    console.log('creating WebSocket', j++);
    const ws = new WebSocket(url);
    wsRef.current = ws;
    const queue = new AsyncQueue<string>();
    ws.onopen = () => {};
    ws.onmessage = (event) => {
      const messageData = event.data;
      if (event.data instanceof Blob) {
        queue.enqueue(async () => {
          const blob = event.data;
          const buffer = await blob.arrayBuffer();
          return new TextDecoder().decode(buffer);
        });
      } else if (event.data instanceof ArrayBuffer) {
        queue.enqueue(new TextDecoder().decode(event.data));
      } else if (typeof event.data === 'string') {
        queue.enqueue(messageData);
      }
    };
    async function processQueue() {
      for await (const message of queue) {
        void writerRef.current?.write(message);
      }
    }
    void processQueue();
    ws.onerror = (event) => {
      console.error('WebSocket error:', event);
    };
    ws.onclose = (event) => {
      console.log('WebSocket connection closed', url, event);
    };
    return () => {
      console.log('Cleaning up WebSocket connection', url);
      function close() {
        ws.close(1000, 'Cleaning up WebSocket connection');
      }
      switch (ws.readyState) {
        case WebSocket.OPEN:
          close();
          break;
        case WebSocket.CONNECTING:
          ws.onopen = close;
          break;
        case WebSocket.CLOSING:
        case WebSocket.CLOSED:
        default:
          break;
      }
    };
  }, [url]);

  const transformStream = useMemo(() => new TransformStream<unknown>({}), []);
  useEffect(() => {
    const writer = transformStream.writable.getWriter();
    writerRef.current = writer;
    return () => {
      writer.releaseLock();
    };
  }, [transformStream]);

  const sendMessage = useCallback((message: string) => {
    wsRef.current?.send(message);
  }, []);

  return {
    sendMessage,
    messageStream: transformStream.readable,
  };
}
