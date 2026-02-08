import { requireAdmin } from "@/lib/auth";
import { subscribeAvailability } from "@/lib/availability-notifier";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * SSE stream: admin dashboard connects here and receives "update" events
 * when any employee starts or ends work. Refetch availability list on event.
 */
export async function GET() {
  await requireAdmin();
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };
      send("connected");
      unsubscribe = subscribeAvailability(() => {
        send("update");
      });
    },
    cancel() {
      if (unsubscribe) unsubscribe();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Connection: "keep-alive",
    },
  });
}
