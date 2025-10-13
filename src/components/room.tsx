'use client';
import { useRoomChatMessages } from '@/hooks/useSocket';
import { useCallback, useEffect, useRef } from 'react';
import { ChatMessage } from '@/dto/ChatMessage';

export function MessageView({ message }: { message: ChatMessage }) {
  return (
    <div className="bg-gray-700 p-3 rounded-md text-gray-200 ">
      <div className="text-xs text-gray-400 ">{message.author}</div>
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

  return (
    <div className="flex flex-col gap-4 p-6 max-w-2xl mx-auto w-full h-full">
      <h1 className="text-2xl font-bold text-gray-100">Room {roomId}</h1>
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
