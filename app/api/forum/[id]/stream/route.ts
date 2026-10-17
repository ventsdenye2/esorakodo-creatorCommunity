import { z } from "zod";
import { createClient } from "../../../../../src/lib/supabase/server";
import { ForumAccessError, forumRouteError, readEditEnvelope, requireForumEditor } from "../../../../../src/features/forum/collaboration-server";

export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; if (!z.uuid().safeParse(id).success) throw new ForumAccessError("作品地址无效。", 400);
    const db = await createClient(), editing = new URL(request.url).searchParams.get("editing") === "1";
    const viewerId = editing ? await requireForumEditor(db, id) : "";
    if (!editing) { const topic = await db.from("forum_topics").select("id").eq("id", id).eq("status", "published").maybeSingle(); if (!topic.data) throw new ForumAccessError("作品当前不可见。", 404); }
    let timer: ReturnType<typeof setTimeout> | undefined, closed = false;
    const started = Date.now(), encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        let revision = -1, lastPresence = 0;
        const close = () => { if (closed) return; closed = true; clearTimeout(timer); request.signal.removeEventListener("abort", close); try { controller.close(); } catch { /* Already cancelled. */ } };
        request.signal.addEventListener("abort", close, { once: true });
        async function tick() {
          if (closed) return;
          try {
            if (Date.now() - started > 55000) { close(); return; }
            if (editing) {
              const saved = await db.from("forum_edit_documents").select("revision").eq("topic_id", id).maybeSingle();
              if (saved.error) throw new Error("connection");
              if (!saved.data) { controller.enqueue(encoder.encode('event: revoked\ndata: {}\n\n')); close(); return; }
              if (revision !== saved.data.revision || Date.now() - lastPresence > 4000) {
                controller.enqueue(encoder.encode("data: " + JSON.stringify(await readEditEnvelope(db, id, viewerId)) + "\n\n"));
                revision = saved.data.revision; lastPresence = Date.now();
              }
            } else {
              const topic = await db.from("forum_topics").select("version").eq("id", id).eq("status", "published").maybeSingle();
              if (topic.error) throw new Error("connection");
              if (!topic.data) { controller.enqueue(encoder.encode('event: unavailable\ndata: {}\n\n')); close(); return; }
              if (revision !== topic.data.version) { revision = topic.data.version; controller.enqueue(encoder.encode("data: " + JSON.stringify({ version: revision }) + "\n\n")); }
            }
            if (!closed) timer = setTimeout(tick, 750);
          } catch { close(); }
        }
        void tick();
      },
      cancel() { closed = true; clearTimeout(timer); },
    });
    return new Response(body, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "private, no-cache, no-transform", "X-Accel-Buffering": "no" } });
  } catch (error) { return forumRouteError(error); }
}
