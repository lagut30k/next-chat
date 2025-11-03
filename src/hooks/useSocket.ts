import { useCallback, useEffect, useMemo, useRef } from 'react';
import { AsyncQueue } from '@/utils/asyncQueue';
import {
  ClientToServerChatMessage,
  ClientToServerChatMessageJsonCodec,
  UserAuthenticationDataJsonCodec,
} from '@/dto/ChatMessage';
import { clearTimeout } from 'node:timers';

export function wsMessageToStringQueue(queue: AsyncQueue<string>) {
  return function (event: WebSocketEventMap['message']) {
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
}

export function useSocket(url: string, userId?: string) {
  const writerRef = useRef<WritableStreamDefaultWriter<string> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!userId) return () => {};
    const queue = new AsyncQueue<string>();

    const authenticate = () => {
      console.log('Authenticating', userId, typeof userId);
      const serialized = UserAuthenticationDataJsonCodec.encode({
        userId: userId,
        nickName: `User-${userId}`,
      });
      reconnectableWs.send(serialized);
    };

    function createWs({
      url,
      queue,
      onOpen = () => {},
      onClose = () => {},
    }: {
      url: string | URL;
      queue: AsyncQueue<string>;
      onOpen?: (ev: WebSocketEventMap['open']) => void;
      onClose?: (ev: WebSocketEventMap['close']) => void;
    }) {
      const ws = new WebSocket(url);
      const handleMessage = wsMessageToStringQueue(queue);
      const handleError = (ev: WebSocketEventMap['error']) => {
        console.log('WebSocket error:', ev);
      };
      const cleanUp = (ev: WebSocketEventMap['close']) => {
        console.log('WebSocket connection closed', url, ev);
        ws.removeEventListener('open', onOpen);
        ws.removeEventListener('message', handleMessage);
        ws.removeEventListener('error', handleError);
        ws.removeEventListener('close', onClose);
        ws.removeEventListener('close', cleanUp);
      };
      ws.addEventListener('open', onOpen);
      ws.addEventListener('message', handleMessage);
      ws.addEventListener('error', handleError);
      ws.addEventListener('close', onClose);
      ws.addEventListener('close', cleanUp);
      return ws;
    }

    function reconnect() {
      console.log('reconnect scheduled');
      reconnectTimeout.current = setTimeout(() => {
        console.log('Reconnecting...');
        console.log('Creating WebSocket', url, userId);
        reconnectableWs = createWs({
          url,
          queue,
          onOpen: authenticate,
          onClose: reconnect,
        });
        wsRef.current = reconnectableWs;
      }, 5_000);
    }
    console.log('Creating WebSocket', url, userId);
    let reconnectableWs = createWs({
      url,
      queue,
      onOpen: authenticate,
      onClose: reconnect,
    });
    wsRef.current = reconnectableWs;

    async function processQueue() {
      for await (const message of queue) {
        void writerRef.current?.write(message);
      }
    }
    void processQueue();

    return () => {
      reconnectableWs.removeEventListener('close', reconnect);
      clearTimeout(reconnectTimeout.current);
      queue.stop();
      console.log('Cleaning up WebSocket connection', url, userId);
      function close() {
        reconnectableWs.close(1000, 'Cleaning up WebSocket connection');
      }
      switch (reconnectableWs.readyState) {
        case WebSocket.OPEN:
          close();
          break;
        case WebSocket.CONNECTING:
          reconnectableWs.onopen = close;
          break;
        case WebSocket.CLOSING:
        case WebSocket.CLOSED:
        default:
          break;
      }
    };
  }, [url, userId]);

  const transformStream = useMemo(
    () => new TransformStream<string, string>({}),
    [],
  );

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
