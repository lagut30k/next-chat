import { useEffect, useMemo } from 'react';
import { EventBus } from '@chat-next/utils/eventBus';

export function useStreamToEventBus<T>(stream: ReadableStream<T>) {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- It's expected to update the eventBus on stream changes
  const eventBus = useMemo(() => new EventBus<T>(), [stream]);
  useEffect(() => {
    if (!stream) return () => {};

    const reader = stream.getReader();
    let canceled = false;

    async function read() {
      try {
        while (!canceled) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          eventBus.publish(value);
        }
      } catch (e) {
        if (!canceled) {
          console.error('Error on reading message stream', e);
          throw e;
        }
      } finally {
        if (!canceled) {
          reader.releaseLock();
        }
      }
    }
    void read();

    return () => {
      canceled = true;
      reader.releaseLock();
    };
  }, [stream, eventBus]);

  return eventBus;
}
