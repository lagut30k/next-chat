'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AsyncQueue } from '@/utils/asyncQueue';
import { useStreamToEventBus } from '@/hooks/useStreamToEventBus';
import { generateUuid } from '@/utils/generateUuid';
import {
  ChatMessage,
  ChatMessageJsonCodec,
  ClientToServerChatMessage,
  ClientToServerChatMessageJsonCodec,
  UserAuthenticationDataJsonCodec,
} from '@/dto/ChatMessage';
import useStore from '@/store/useStore';
import { useUserIdStore } from '@/store/user';

let j = 1;

export function useSocket(url: string, userId: string) {
  const writerRef = useRef<WritableStreamDefaultWriter<string> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    console.log('creating WebSocket', j++);
    const authenticate = () => {
      console.log('Authenticating', userId);
      const serialized = UserAuthenticationDataJsonCodec.encode({
        userId: userId,
        nickName: `User-${userId}`,
      });
      ws.send(serialized);
    };
    const ws = new WebSocket(url);
    wsRef.current = ws;
    const queue = new AsyncQueue<string>();
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
