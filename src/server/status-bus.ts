type Listener = (payload: unknown) => void;

const g = globalThis as typeof globalThis & {
  __qb1Status?: Map<string, Set<Listener>>;
};

function bus() {
  if (!g.__qb1Status) g.__qb1Status = new Map();
  return g.__qb1Status;
}

export function publish(jobId: string, payload: unknown) {
  const listeners = bus().get(jobId);
  if (!listeners) return;
  for (const fn of listeners) {
    try {
      fn(payload);
    } catch {
      /* ignore dropped SSE */
    }
  }
}

export function subscribe(jobId: string, fn: Listener) {
  const map = bus();
  const set = map.get(jobId) ?? new Set<Listener>();
  set.add(fn);
  map.set(jobId, set);
  return () => {
    set.delete(fn);
    if (set.size === 0) map.delete(jobId);
  };
}
