/**
 * In-memory notifier for admin availability UI updates.
 * When an employee starts or ends work, we notify all connected admin streams
 * so the dashboard updates in real time without refresh.
 */

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeAvailability(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyAvailabilityChange(): void {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // ignore
    }
  });
}
