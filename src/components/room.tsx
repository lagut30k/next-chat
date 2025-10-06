'use client';
import { useSocket } from '@/hooks/useSocket';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { release } from 'node:os';
import { delay } from '@/app/utils/delay';

export function Room({ roomId, id }: { roomId: string; id: Promise<string> }) {
  const { sendMessage, messageStream } = useSocket({
    roomId,
    id,
  });
  const messageStreamRef = useRef(messageStream);
  useEffect(() => {
    console.log('setting message stream');
    messageStreamRef.current = messageStream;
  }, [messageStream]);
  const getMessageStream = () => messageStreamRef.current;
  const [messages, setMessages] = useState<string[]>([]);

  const submit = useCallback(
    (formData: FormData) => {
      const text = formData.get('text') as string;
      sendMessage(text);
    },
    [sendMessage],
  );

  useEffect(() => {
    console.log('getting reader for ', messageStream);
    if (messageStream.locked) {
      return;
    }
    const reader = messageStream.getReader();

    let stopped = false;

    const read = async () => {
      while (!stopped) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('done');
          break;
        }
        setMessages((messages) => [...messages, value]);
      }
    };

    void read();

    return () => {
      if (getMessageStream() === messageStream) {
        return;
      }
      stopped = true;
      try {
        // reader.closed.catch((e) => {
        //   console.log('reader closed with error', e);
        // });

        reader.releaseLock();
      } catch (e) {
        // silently ignore
        console.log('reader releaseLock error', e);
      }
    };
  }, [messageStream]);

  return (
    <div className="flex flex-col gap-4 p-6 max-w-2xl mx-auto w-full">
      <h1 className="text-2xl font-bold text-gray-100">Room {roomId}</h1>
      <div className="flex flex-col gap-2 border border-gray-700 rounded-lg p-4 bg-gray-800 shadow-md">
        <span className="text-gray-300 font-medium mb-2">Messages:</span>
        {messages.map((m, i) => (
          <div key={i} className="bg-gray-700 p-3 rounded-md text-gray-200">
            {m}
          </div>
        ))}
      </div>
      <form action={submit} className="flex gap-2" autoComplete="off">
        <input
          name="text"
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
