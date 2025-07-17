import { AsyncLocalStorage } from 'async_hooks';

const asyncLocalStorage = new AsyncLocalStorage<Map<string, string>>();

/**
 * Executes a function within an AsyncLocalStorage context containing the provided trace ID.
 * @param traceId - The trace ID to associate with the current asynchronous context.
 * @param fn - The function to execute within the trace context.
 * @returns T - The result of the executed function.
 */
export const runWithTraceId = <T>(traceId: string, fn: () => T) => {
  const store = new Map<string, string>();
  store.set('traceId', traceId);
  return asyncLocalStorage.run(store, fn);
};

/**
 * Retrieves the current trace ID from the AsyncLocalStorage context.
 * @returns string - The trace ID if available, otherwise 'no-trace'.
 */
export const getTraceId = (): string => {
  const store = asyncLocalStorage.getStore();
  return store?.get('traceId') || 'no-trace';
};
