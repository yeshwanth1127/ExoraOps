/**
 * In-memory notifier for real-time ping delivery.
 * When admin sends a ping, we notify the target user's SSE listeners.
 * Works when the app runs in a single Node process (e.g. dev or node server).
 */

type Listener = () => void;
const listenersByUser = new Map<string, Set<Listener>>();

export function subscribePing(userId: string, onPing: Listener): () => void {
  let set = listenersByUser.get(userId);
  if (!set) {
    set = new Set();
    listenersByUser.set(userId, set);
  }
  set.add(onPing);
  return () => {
    set?.delete(onPing);
    if (set?.size === 0) listenersByUser.delete(userId);
  };
}

export function notifyPingSent(targetUserId: string): void {
  const set = listenersByUser.get(targetUserId);
  if (set) {
    set.forEach((fn) => {
      try {
        fn();
      } catch {
        // ignore
      }
    });
  }
}
