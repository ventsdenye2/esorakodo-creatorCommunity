import { z } from "zod";
import { createClient } from "../../../../../src/lib/supabase/server";
import { isSameMediaOrigin } from "../../../../../src/features/media/same-origin.mjs";
import { ForumAccessError, forumRouteError, requireForumEditor } from "../../../../../src/features/forum/collaboration-server";
import { managementError, restoreCheckpoint } from "../../../../../src/features/forum/checkpoint-server";

const schema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("search"), query: z.string().trim().min(2).max(60) }),
  z.object({ kind: z.literal("mode"), mode: z.enum(["owner", "invited", "everyone"]) }),
  z.object({ kind: z.literal("invite"), revoke: z.boolean() }),
  z.object({ kind: z.literal("checkpoint"), label: z.string().trim().min(1).max(100), revision: z.number().int().positive() }),
  z.object({ kind: z.literal("restore"), checkpointId: z.uuid(), revision: z.number().int().positive() }),
]);
const headers = { "Cache-Control": "private, no-store" };
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; if (!z.uuid().safeParse(id).success) throw new ForumAccessError("作品地址无效。", 400);
    const db = await createClient(); await requireForumEditor(db, id);
    const [history, settings] = await Promise.all([
      db.from("forum_checkpoints").select("id,parent_id,label,created_by,created_at,document_revision").eq("topic_id", id).order("created_at"),
      db.from("forum_edit_settings").select("head_id,mode").eq("topic_id", id).maybeSingle(),
    ]);
    if (history.error || settings.error) throw new ForumAccessError("版本记录暂时无法读取。", 503);
    return Response.json({ checkpoints: history.data, headId: settings.data?.head_id ?? null, mode: settings.data?.mode ?? "invited" }, { headers });
  } catch (error) { return forumRouteError(error); }
}
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isSameMediaOrigin(request, { production: process.env.NODE_ENV === "production", siteUrl: process.env.NEXT_PUBLIC_SITE_URL })) throw new ForumAccessError("请求来源无效。");
    const raw = await request.text(); if (raw.length > 4000) throw new ForumAccessError("请求过大。", 413);
    const parsed = schema.safeParse(JSON.parse(raw)); if (!parsed.success) throw new ForumAccessError("请求格式无效。", 400);
    const { id } = await params; if (!z.uuid().safeParse(id).success) throw new ForumAccessError("作品地址无效。", 400);
    const db = await createClient(); await requireForumEditor(db, id); const data = parsed.data;
    if (data.kind === "restore") { await restoreCheckpoint(db, id, data.checkpointId, data.revision); return Response.json({ ok: true }, { headers }); }
    const result = data.kind === "search" ? await db.rpc("search_forum_creators", { p_topic_id: id, p_query: data.query })
      : data.kind === "mode" ? await db.rpc("set_forum_edit_mode", { p_topic_id: id, p_mode: data.mode })
      : data.kind === "invite" ? await db.rpc("rotate_forum_invite", { p_topic_id: id, p_revoke: data.revoke })
      : await db.rpc("create_forum_checkpoint", { p_topic_id: id, p_expected_revision: data.revision, p_label: data.label });
    if (result.error) throw managementError(result.error.message);
    return Response.json({ result: result.data }, { headers });
  } catch (error) { return forumRouteError(error); }
}
