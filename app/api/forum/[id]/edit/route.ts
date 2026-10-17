import { z } from "zod";
import { createClient } from "../../../../../src/lib/supabase/server";
import { isSameMediaOrigin } from "../../../../../src/features/media/same-origin.mjs";
import { ForumAccessError, forumRouteError, mergeForumEdit, readEditEnvelope, requireForumEditor } from "../../../../../src/features/forum/collaboration-server";

export const dynamic = "force-dynamic";
const input = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("update"), update: z.string().min(1).max(2800000), publish: z.boolean().default(false) }),
  z.object({ kind: z.literal("member"), handle: z.string().trim().min(2).max(60).optional(), removeId: z.uuid().optional() }),
  z.object({ kind: z.literal("presence"), sessionId: z.uuid(), field: z.string().max(120), leave: z.boolean().default(false) }),
]);
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const { id } = await params; if (!z.uuid().safeParse(id).success) throw new ForumAccessError("作品地址无效。", 400); const db = await createClient(); const viewer = await requireForumEditor(db, id); return Response.json(await readEditEnvelope(db, id, viewer), { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return forumRouteError(error); }
}
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isSameMediaOrigin(request, { production: process.env.NODE_ENV === "production", siteUrl: process.env.NEXT_PUBLIC_SITE_URL })) throw new ForumAccessError("请求来源无效。");
    if (Number(request.headers.get("content-length") ?? 0) > 3000000) throw new ForumAccessError("请求过大。", 413);
    const raw = await request.text(); if (raw.length > 3000000) throw new ForumAccessError("请求过大。", 413);
    const parsed = input.safeParse(JSON.parse(raw)); if (!parsed.success) throw new ForumAccessError("协作请求格式无效。", 400);
    const { id } = await params; if (!z.uuid().safeParse(id).success) throw new ForumAccessError("作品地址无效。", 400);
    const db = await createClient(), viewer = await requireForumEditor(db, id), data = parsed.data;
    if (data.kind === "update") return Response.json(await mergeForumEdit(db, id, viewer, data.update, data.publish), { headers: { "Cache-Control": "no-store" } });
    if (data.kind === "presence") {
      const result = await db.rpc("touch_forum_presence", { p_topic_id: id, p_session_id: data.sessionId, p_field: data.field, p_leave: data.leave });
      if (result.error) throw new ForumAccessError("在线状态更新失败。", 403);
      return Response.json({ ok: true });
    }
    const result = await db.rpc("manage_forum_collaborator", { p_topic_id: id, p_handle: data.handle ?? null, p_remove_id: data.removeId ?? null });
    if (result.error) throw new ForumAccessError(result.error.message.includes("OWNER_REQUIRED") ? "只有作者可以管理协作者。" : result.error.message.includes("FIRST_POST") ? "先完成首帖，再邀请协作者。" : "未找到这个创作者，请核对 @账号。", result.error.message.includes("OWNER_REQUIRED") ? 403 : 400);
    return Response.json(await readEditEnvelope(db, id, viewer));
  } catch (error) { return forumRouteError(error); }
}
