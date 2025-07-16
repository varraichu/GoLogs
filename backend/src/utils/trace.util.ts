import { AsyncLocalStorage } from 'async_hooks';

const asyncLocalStorage = new AsyncLocalStorage<Map<string, string>>();

export const runWithTraceId = <T>(traceId: string, fn: () => T) => {
  const store = new Map<string, string>();
  store.set('traceId', traceId);
  return asyncLocalStorage.run(store, fn);
};

export const getTraceId = (): string => {
  const store = asyncLocalStorage.getStore();
  return store?.get('traceId') || 'no-trace';
};
