export class EventBus<T> {
  private listeners: Set<(message: T) => void> = new Set();
  subscribe(listener: (message: T) => void) {
    this.listeners.add(listener);
    return () => {
      this.unsubscribe(listener);
    };
  }
  unsubscribe(listener: (message: T) => void) {
    this.listeners.delete(listener);
  }
  publish(message: T) {
    for (const listener of this.listeners) {
      listener(message);
    }
  }
}
