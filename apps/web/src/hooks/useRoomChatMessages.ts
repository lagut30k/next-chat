import useStore from '@/store/useStore';
import { useUserIdStore } from '@/store/user';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSocketAsQueue } from '@/hooks/useSocketAsQueue';
import { ChatMessagePayload } from '@chat-next/dto/serverToClient/chat/ServerToClientChatMessagePayload';
import { ChatMessageContent } from '@chat-next/dto/shared/chat/ChatMessageContent';
import {
  ClientToServerJsonCodec,
  ClientToServerMessage,
} from '@chat-next/dto/clientToServer/ClientToServerMessage';
import { ServerToClientJsonCodec } from '@chat-next/dto/serverToClient/ServerToClientMessage';

export function useRoomChatMessages(roomId: string) {
  const userId = useStore(useUserIdStore, (state) => state.userId);
  const url = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const host = window.location.host;
    const isSecure = window.location.protocol === 'https:';
    return `${isSecure ? 'wss' : 'ws'}://${host}/realtime/rooms/${roomId}`;
  }, [roomId]);
  const { sendMessage: sendRawMessage, messageQueue } = useSocketAsQueue(
    url,
    userId,
  );
  const messageQueueRef = useRef(messageQueue);
  const sendMessage = useCallback(
    (message: ChatMessageContent) => {
      const rawMessage: ClientToServerMessage = {
        type: 'chat',
        payload: message,
      };
      const serialised = ClientToServerJsonCodec.encode(rawMessage);
      sendRawMessage(serialised);
    },
    [sendRawMessage],
  );
  const [messages, setMessages] = useState<ChatMessagePayload[]>([]);
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
          const parseResult = ServerToClientJsonCodec.safeParse(message);
          if (!parseResult.success) {
            console.error('[effect]Invalid message:', parseResult.error);
            continue;
          }
          const parsed = parseResult.data;
          switch (parsed.type) {
            case 'chat':
              setMessages((messages) => [...messages, parsed.payload]);
              break;
            case 'service':
              console.log('Received service message', parsed.payload);
              break;
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
