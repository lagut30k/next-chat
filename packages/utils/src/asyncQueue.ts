import { promiseFromAbortSignal } from '@chat-next/utils/promiseFromAbortSignal';

type Initializer<T> = T | (() => T);
type AsyncInitializer<T> = Initializer<T | Promise<T>>;

export class AsyncQueue<T> {
  private queue: (Promise<T> | T)[] = [];
  private queueStarted = Promise.withResolvers<void>();
  private stopped = false;
  readonly debug: Record<string, unknown> = {};

  enqueue(taskOrFunc: AsyncInitializer<T>) {
    if (this.stopped) {
      return;
    }
    const task = taskOrFunc instanceof Function ? taskOrFunc() : taskOrFunc;
    this.queue.push(task);
    this.queueStarted.resolve();
  }

  stop() {
    this.stopped = true;
    this.queueStarted.resolve();
  }

  get finished() {
    return this.queue.length === 0 && this.stopped;
  }

  tryDequeue() {
    if (this.stopped) return { success: false, value: undefined };
    if (this.queue.length === 0) return { success: false, value: undefined };
    const item = this.queue.shift();

    if (this.queue.length === 0) {
      // Most likely we don't have to resolve the previous promise here (expected to be already resolved), but it's safer to resolve it anyway
      this.queueStarted.resolve();
      this.queueStarted = Promise.withResolvers<void>();
    }

    return { success: true, value: item };
  }

  async *[Symbol.asyncIterator]() {
    try {
      while (true) {
        if (this.stopped && this.queue.length === 0) {
          break;
        }
        const { success, value } = this.tryDequeue();
        if (success) yield value;
        await this.queueStarted.promise;
      }
    } catch (e) {
      console.log('[iterator] error in queue iteration', e);
    }
  }

  async *abortableIterator(signal: AbortSignal) {
    const abortPromise = promiseFromAbortSignal(signal);
    while (true) {
      await Promise.race([this.queueStarted.promise, abortPromise]);
      if (this.stopped && this.queue.length === 0) {
        break;
      }
      const { success, value } = this.tryDequeue();
      if (success) yield value;
    }
  }
}
