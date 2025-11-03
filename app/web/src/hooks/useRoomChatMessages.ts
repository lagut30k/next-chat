import useStore from '@/store/useStore';
import { useUserIdStore } from '@/store/user';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChatMessage,
  ChatMessageJsonCodec,
  ClientToServerChatMessage,
  ClientToServerChatMessageJsonCodec,
} from '@/dto/ChatMessage';
import { useSocketAsQueue } from '@/hooks/useSocketAsQueue';

export function useRoomChatMessages(roomId: string) {
  const userId = useStore(useUserIdStore, (state) => state.userId);
  const url = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const host = window.location.host;
    const isSecure = window.location.protocol === 'https:';
    return `${isSecure ? 'wss' : 'ws'}://${host}/ws/rooms/${roomId}`;
  }, [roomId]);
  const { sendMessage: sendRawMessage, messageQueue } = useSocketAsQueue(
    url,
    userId,
  );
  const messageQueueRef = useRef(messageQueue);
  const sendMessage = useCallback(
    (message: ClientToServerChatMessage) => {
      const serialised = ClientToServerChatMessageJsonCodec.encode(message);
      sendRawMessage(serialised);
    },
    [sendRawMessage],
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  useEffect(() => {
    console.log(
      '[effect]useEffect',
      messageQueue === messageQueueRef.current,
      messageQueue,
    );
    messageQueueRef.current = messageQueue;

    const abortController = new AbortController();
    async function processQueue() {
      try {
        const iterator = messageQueue.abortableIterator(abortController.signal);
        for await (const message of iterator) {
          const parseResult = ChatMessageJsonCodec.safeParse(message);
          if (parseResult.success) {
            setMessages((messages) => [...messages, parseResult.data]);
          } else {
            console.error('[effect]Invalid message:', parseResult.error);
          }
        }
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') {
          console.log('[effect]aborted');
        } else {
          throw e;
        }
      }
      console.log('[effect]finished processing queue');
    }
    void processQueue();

    return () => {
      abortController.abort();
    };
  }, [messageQueue]);

  return {
    messages,
    sendMessage,
  };
}
