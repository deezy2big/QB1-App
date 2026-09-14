import { readJob } from "@/server/job-store";
import { subscribe } from "@/server/status-bus";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const current = await readJob(id);
  if (!current) return new Response("not found", { status: 404 });

  const encoder = new TextEncoder();
  let unsub = () => {};
  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };
      send({ job: current });
      unsub = subscribe(id, send);
    },
    cancel() {
      unsub();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
