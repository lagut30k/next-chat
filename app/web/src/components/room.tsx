'use client';
import { useCallback, useEffect, useRef } from 'react';
import { ChatMessage } from '@/dto/ChatMessage';
import { useUserIdStore } from '@/store/user';
import useStore from '@/store/useStore';
import { generateUuid } from '@/utils/generateUuid';
import { useRoomChatMessages } from '@/hooks/useRoomChatMessages';

export function MessageView({ message }: { message: ChatMessage }) {
  const userId = useStore(useUserIdStore, (state) => state.userId);
  const isMe = message.author.id === userId;
  return (
    <div
      className={` p-3 rounded-md ${isMe ? 'text-blue-200 bg-blue-700' : 'text-gray-200 bg-gray-700'}`}
    >
      <div className="text-xs text-gray-400 ">{message.author.nickName}</div>
      <div className="text-gray-200">{message.content}</div>
    </div>
  );
}

export function Room({ roomId }: { roomId: string }) {
  const { sendMessage, messages } = useRoomChatMessages(roomId);

  const submit = useCallback(
    (formData: FormData) => {
      const text = formData.get('text') as string;
      sendMessage({
        content: text,
      });
    },
    [sendMessage],
  );
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesContainerRef.current?.scroll({
      top: messagesContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  const userId = useStore(useUserIdStore, (state) => state.userId);
  const setUserId = useUserIdStore((state) => state.setUser);
  const regenerateUserId = useCallback(() => {
    setUserId(generateUuid());
  }, [setUserId]);
  return (
    <div className="flex flex-col gap-4 p-6 max-w-2xl mx-auto w-full h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-100">Room {roomId}</h1>
        <span className="text-gray-400 text-sm">{userId}</span>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          onClick={regenerateUserId}
        >
          Regenerate userId
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-2 border border-gray-700 rounded-lg p-4 bg-gray-800 shadow-md grow overflow-y-hidden">
        <div className="text-gray-300 font-medium mb-2">Messages:</div>
        <div
          className="grow overflow-y-auto flex flex-col gap-2"
          ref={messagesContainerRef}
        >
          {messages.map((m) => (
            <MessageView message={m} key={m.id} />
          ))}
        </div>
      </div>
      <form action={submit} className="flex gap-2" autoComplete="off">
        <input
          name="text"
          autoFocus
          className="flex-1 px-4 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Send message
        </button>
      </form>
    </div>
  );
}
