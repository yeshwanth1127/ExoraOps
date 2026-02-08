import { requireSession } from "@/lib/auth";
import { subscribePing } from "@/lib/ping-notifier";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * SSE stream: employee connects here and receives "ping" events
 * as soon as an admin sends them a ping. Uses in-memory notifier
 * (single-process; for serverless consider Redis pub/sub).
 */
export async function GET() {
  const session = await requireSession();
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };
      send("connected");
      unsubscribe = subscribePing(session.id, () => {
        send("ping");
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
