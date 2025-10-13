'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AsyncQueue } from '@/utils/asyncQueue';
import { useStreamToEventBus } from '@/hooks/useStreamToEventBus';
import {
  ChatMessage,
  ChatMessageJsonCodec,
  ClientToServerChatMessage,
  ClientToServerChatMessageJsonCodec,
  UserAuthenticationDataJsonCodec,
} from '@/dto/ChatMessage';
import useStore from '@/store/useStore';
import { useUserIdStore } from '@/store/user';

export function useSocket(url: string, userId?: string) {
  const writerRef = useRef<WritableStreamDefaultWriter<string> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId) return () => {};
    if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    const queue = new AsyncQueue<string>();

    const authenticate = () => {
      console.log('Authenticating', userId, typeof userId);
      const serialized = UserAuthenticationDataJsonCodec.encode({
        userId: userId,
        nickName: `User-${userId}`,
      });
      reconnectableWs.send(serialized);
    };

    function createWs() {
      console.log('Creating WebSocket', url, userId);
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onopen = () => {
        authenticate();
      };
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
      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
      };
      ws.addEventListener('close', reconnect);
      return ws;
    }

    function reconnect(event: CloseEvent) {
      console.log('WebSocket connection closed', url, event);
      if (!event.wasClean) {
        reconnectTimeout.current = setTimeout(() => {
          console.log('Reconnecting...');
          reconnectableWs = createWs();
        }, 1000);
      }
    }
    let reconnectableWs = createWs();

    async function processQueue() {
      for await (const message of queue) {
        void writerRef.current?.write(message);
      }
    }
    void processQueue();
    return () => {
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
      reconnectableWs.removeEventListener('close', reconnect);
    };
  }, [url, userId]);

  const transformStream = useMemo(
    () => new TransformStream<unknown, string>({}),
    [],
  );
  useEffect(() => {
    const writer = transformStream.writable.getWriter();
    writerRef.current = writer;
    return () => {
      writer.releaseLock();
    };
  }, [transformStream]);

  const sendMessage = useCallback((message: ClientToServerChatMessage) => {
    const serialised = ClientToServerChatMessageJsonCodec.encode(message);
    wsRef.current?.send(serialised);
  }, []);

  return {
    sendMessage,
    messageStream: transformStream.readable,
  };
}

export function useRoomChatMessages(roomId: string) {
  const userId = useStore(useUserIdStore, (state) => state.userId);
  const { sendMessage, messageStream } = useSocket(
    `ws://localhost:3000/ws/rooms/${roomId}`,
    userId,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const eventBus = useStreamToEventBus(messageStream);
  useEffect(() => {
    return eventBus.subscribe((message) => {
      console.log('message received', message);
      const parseResult = ChatMessageJsonCodec.safeParse(message);
      if (parseResult.success) {
        setMessages((messages) => [...messages, parseResult.data]);
      } else {
        console.error('Invalid message:', parseResult.error);
      }
    });
  }, [eventBus]);
  return {
    messages,
    sendMessage,
  };
}
