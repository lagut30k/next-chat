export class PromiseWithResolvers<T> {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
  readonly reject: (reason: unknown) => void;

  constructor() {
    let hackTsResolve: (value: T) => void;
    let hackTsReject: (reason: unknown) => void;
    this.promise = new Promise<T>((resolve, reject) => {
      hackTsResolve = resolve;
      hackTsReject = reject;
    });
    this.resolve = hackTsResolve!;
    this.reject = hackTsReject!;
  }
}
