import { PromiseWithResolvers } from '@/utils/promiseWithResolvers';

type Initializer<T> = T | (() => T);
type AsyncInitializer<T> = Initializer<T | Promise<T>>;

const finishSignal = Symbol('finish signal');
type FinishSignal = typeof finishSignal;

export class AsyncQueue<T> {
  private queue: (Promise<T | FinishSignal> | T | FinishSignal)[] = [];
  private queueStarted = new PromiseWithResolvers<void>();
  private stopped = false;

  enqueueInternal(taskOrFunc: AsyncInitializer<T | FinishSignal>) {
    if (this.stopped) {
      return;
    }
    if (this.queue.length === 0) {
      this.queueStarted.resolve();
      this.queueStarted = new PromiseWithResolvers<void>();
    }
    const task = taskOrFunc instanceof Function ? taskOrFunc() : taskOrFunc;
    this.queue.push(task);
  }

  private async dequeueInternal(): Promise<T | FinishSignal> {
    if (this.queue.length === 0) {
      await this.queueStarted.promise;
    }
    return this.queue.shift()!;
  }

  enqueue(taskOrFunc: AsyncInitializer<T>) {
    return this.enqueueInternal(taskOrFunc);
  }

  stop() {
    this.enqueueInternal(finishSignal);
    this.stopped = true;
  }

  async *[Symbol.asyncIterator]() {
    while (true) {
      if (this.stopped && this.queue.length === 0) {
        break;
      }
      const task = await this.dequeueInternal();
      if (task === finishSignal) {
        break;
      }
      yield task;
    }
  }
}
