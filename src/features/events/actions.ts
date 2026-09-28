"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "../../lib/supabase/server";
import { eventSchema } from "./schemas";
import type { Json } from "../../types/database";
import { structuredBodySchema } from "../editor/types";

export type EventSaveState = { error: string | null };
function friendlyError(message: string) {
  if (message.includes("VERSION_CONFLICT")) return "这份内容已有更新。请在新标签页打开最新版本，核对后再保存；当前输入仍保留在此页。";
  if (message.includes("FORBIDDEN")) return "你无权维护这份档案，请通过独立补充提交材料。";
  if (message.includes("NOT_FOUND")) return "档案不存在或暂不可访问。";
  if (message.includes("NODE") || message.includes("node")) return "时间节点无效，或已有补充材料引用了被移除的节点。请保留该节点后重试。";
  if (message.includes("INVALID")) return "部分内容不符合保存要求，请检查标题、正文及关联资料。";
  return "未能保存，请稍后重试。";
}
function json(form: FormData, key: string) { try { return JSON.parse(String(form.get(key) ?? "null")) as unknown; } catch { return null; } }
function identity(form: FormData) { return { id: form.get("id") ? String(form.get("id")) : null, version: form.get("version") ? Number(form.get("version")) : null }; }
export async function saveEvent(_: EventSaveState, form: FormData): Promise<EventSaveState> {
  const parsed = eventSchema.safeParse({ ...identity(form), ...Object.fromEntries(["title", "summary", "time_range", "causes", "consequences", "starts_on", "ends_on"].map((key) => [key, String(form.get(key) ?? "")])), nodes: json(form, "nodes"), links: json(form, "links") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "请检查档案内容。" };
  const v = parsed.data;
  const publish = form.get("intent") === "publish";
  if (publish && (!v.summary || !v.time_range || !v.nodes.length)) return { error: "发布前请填写概述与时间说明，并添加至少一个时间节点。" };
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { error: "请登录后再保存。" };
  const { data, error } = await db.rpc("save_event", { p_id: v.id, p_expected_version: v.version, p_title: v.title, p_summary: v.summary, p_time_range: v.time_range, p_causes: v.causes, p_consequences: v.consequences, p_nodes: v.nodes, p_links: v.links, p_starts_on: v.starts_on || null, p_ends_on: v.ends_on || null, p_publish: publish });
  if (error || !data) return { error: friendlyError(error?.message ?? "") };
  revalidatePath("/events"); revalidatePath("/"); revalidatePath("/creator"); revalidatePath(`/events/${data}`); revalidatePath(`/create/event/${data}`);
  redirect(publish ? `/events/${data}` : `/create/event/${data}?saved=1`);
}
export async function saveSupplement(_: EventSaveState, form: FormData): Promise<EventSaveState> {
  const parsed = z.object({ id: z.uuid().nullable(), version: z.number().int().positive().nullable(), event_id: z.uuid(), timeline_node_id: z.uuid().nullable(), title: z.string().trim().min(1, "请填写资料标题").max(160), kind: z.enum(["detail", "perspective", "aftermath", "rumor", "interpretation", "article", "testimony", "document"]), body: structuredBodySchema }).safeParse({ ...identity(form), event_id: form.get("event_id"), timeline_node_id: form.get("timeline_node_id") || null, title: form.get("title"), kind: form.get("kind"), body: json(form, "body") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "请检查补充内容。" };
  const v = parsed.data;
  if (form.get("intent") === "publish" && !v.body.blocks.some((block) => "text" in block ? block.text.trim() : true)) return { error: "发布前请填写补充资料正文。" };
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { error: "请登录后再保存。" };
  const publish = form.get("intent") === "publish";
  const { data, error } = await db.rpc("save_event_supplement", { p_id: v.id, p_expected_version: v.version, p_event_id: v.event_id, p_timeline_node_id: v.timeline_node_id, p_title: v.title, p_kind: v.kind, p_body: v.body as Json, p_publish: publish });
  if (error || !data) return { error: friendlyError(error?.message ?? "") };
  revalidatePath("/events"); revalidatePath("/creator"); revalidatePath(`/events/${v.event_id}`); revalidatePath(`/events/${v.event_id}/supplements/${data}`); revalidatePath(`/create/event/supplement/${data}`);
  redirect(publish ? `/events/${v.event_id}/supplements/${data}` : `/create/event/supplement/${data}?saved=1`);
}
