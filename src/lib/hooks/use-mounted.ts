import { useSyncExternalStore } from 'react';

let mounted = false;
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  if (!mounted && typeof window !== 'undefined') {
    mounted = true;
    listeners.forEach((listener) => listener());
  }
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot() {
  return mounted;
}

function getServerSnapshot() {
  return false;
}

export function useMounted() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
