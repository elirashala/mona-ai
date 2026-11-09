// Strict Mode cleans up its first effect before this microtask runs. Skip that
// abandoned setup rather than sending a request that is immediately cancelled.
export function deferredLoad<T>(
  signal: AbortSignal,
  load: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  return Promise.resolve().then(() => {
    signal.throwIfAborted()
    return load(signal)
  })
}
