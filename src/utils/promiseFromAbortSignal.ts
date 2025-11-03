export function promiseFromAbortSignal(signal: AbortSignal) {
  return new Promise<void>((_, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
    }
    signal.addEventListener('abort', () => {
      reject(signal.reason);
    });
  });
}
