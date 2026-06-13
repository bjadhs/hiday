import { useSyncExternalStore } from 'react';

interface NowStore {
  now: number;
  listeners: Set<() => void>;
  intervalId: ReturnType<typeof setInterval> | null;
}

const stores = new Map<number, NowStore>();

function getStore(interval: number): NowStore {
  let store = stores.get(interval);
  if (!store) {
    store = {
      now: Date.now(),
      listeners: new Set(),
      intervalId: null,
    };
    stores.set(interval, store);
  }
  return store;
}

function subscribe(store: NowStore, interval: number, callback: () => void) {
  store.listeners.add(callback);
  if (store.intervalId === null && typeof window !== 'undefined') {
    store.intervalId = setInterval(() => {
      store.now = Date.now();
      store.listeners.forEach((listener) => listener());
    }, interval);
  }
  return () => {
    store.listeners.delete(callback);
  };
}

export function useNow(interval = 60000) {
  const store = getStore(interval);
  return useSyncExternalStore(
    (callback) => subscribe(store, interval, callback),
    () => store.now,
    () => store.now
  );
}
