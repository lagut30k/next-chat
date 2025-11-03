import { useCallback, useEffect, useRef, useState } from 'react';
import { AsyncQueue } from '@/utils/asyncQueue';
import { UserAuthenticationDataJsonCodec } from '@/dto/ChatMessage';

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
    ws.removeEventListener('close', cleanUp);
    ws.removeEventListener('close', onClose);
  };
  ws.addEventListener('open', onOpen);
  ws.addEventListener('message', handleMessage);
  ws.addEventListener('error', handleError);
  ws.addEventListener('close', onClose);
  ws.addEventListener('close', cleanUp);
  return ws;
}

export function useSocketAsQueue(url: string, userId?: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [queue, setQueue] = useState<AsyncQueue<string>>(() => {
    const queue = new AsyncQueue<string>();
    queue.debug.url = url;
    queue.debug.userId = userId;
    return queue;
  });

  useEffect(() => {
    if (!userId) return () => {};
    const createQueue = () => {
      const queue = new AsyncQueue<string>();
      queue.debug.url = url;
      queue.debug.userId = userId;
      return queue;
    };
    const queue = createQueue();
    setQueue(queue);
    const authenticate = () => {
      console.log('Authenticating', userId, typeof userId);
      const serialized = UserAuthenticationDataJsonCodec.encode({
        userId: userId,
        nickName: `User-${userId}`,
      });
      ws.send(serialized);
    };

    function reconnect() {
      console.log('reconnect scheduled');
      reconnectTimeout.current = setTimeout(() => {
        console.log('Reconnecting...');
        console.log('Creating WebSocket', url, userId);
        ws = createWs({
          url,
          queue,
          onOpen: authenticate,
          onClose: reconnect,
        });
        wsRef.current = ws;
      }, 5_000);
    }
    console.log('Creating WebSocket', url, userId);
    let ws = createWs({
      url,
      queue,
      onOpen: authenticate,
      onClose: reconnect,
    });
    wsRef.current = ws;

    return () => {
      ws.removeEventListener('close', reconnect);
      clearTimeout(reconnectTimeout.current);
      console.log('Cleaning up WebSocket connection', url, userId);
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
  }, [url, userId]);

  const sendMessage = useCallback((message: string) => {
    wsRef.current?.send(message);
  }, []);

  return {
    sendMessage,
    messageQueue: queue,
  };
}
