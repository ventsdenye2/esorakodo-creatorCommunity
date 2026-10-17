import * as Y from "yjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ForumAccount, Json } from "../../types/database";
import { getForumTopic } from "./queries";
import { MAX_DOCUMENT_BYTES, publishableSnapshot, readForum, seedForum } from "./collaboration-document";

type DB = SupabaseClient<Database>;
export class ForumAccessError extends Error { constructor(message: string, public status = 403) { super(message); } }
export type EditDocument = Database["public"]["Tables"]["forum_edit_documents"]["Row"];
export type Collaborator = { id: string; handle: string; display_name: string; avatar_asset_id: string | null };
export type EditEnvelope = { document: EditDocument; ownerId: string; viewerId: string; status: string; version: number; accounts: ForumAccount[]; members: Collaborator[]; presence: { session_id: string; creator_id: string; field: string; seen_at: string }[] };

export async function requireForumEditor(db: DB, id: string) {
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw new ForumAccessError("请先登录。当前输入仍保留。", 401);
  const { data: allowed, error } = await db.rpc("can_edit_forum", { p_topic_id: id });
  if (error) throw new ForumAccessError("协作服务暂不可用，请保留当前内容后重试。", 503);
  if (!allowed) throw new ForumAccessError("编辑权限已失效，或作品当前不可编辑。当前输入仍保留。");
  return user.id;
}

export async function readEditEnvelope(db: DB, id: string, viewerId: string): Promise<EditEnvelope> {
  const [topic, saved, accounts, members, presence] = await Promise.all([
    db.from("forum_topics").select("creator_id,status,version").eq("id", id).single(),
    db.from("forum_edit_documents").select("*").eq("topic_id", id).maybeSingle(),
    db.rpc("list_forum_edit_accounts", { p_topic_id: id }),
    db.from("forum_collaborators").select("creator_id").eq("topic_id", id),
    db.from("forum_edit_presence").select("session_id,creator_id,field,seen_at").eq("topic_id", id).gt("seen_at", new Date(Date.now() - 45000).toISOString()),
  ]);
  if (topic.error || !topic.data || saved.error || accounts.error || members.error || presence.error) throw new ForumAccessError("无法读取协作内容，请保留输入后重试。", 503);
  let document = saved.data;
  if (!document) {
    const result = await getForumTopic(id, true);
    if (!result) throw new ForumAccessError("作品不可编辑。");
    const doc = seedForum({ title: result.topic.title, board: result.topic.board, tags: result.topic.tags.join(", "), links: result.links,
      floors: result.floors.map(floor => ({ id: floor.id, body: floor.body, forum_account_id: floor.forum_account_id, in_world_time: floor.in_world_time ?? "", like_count: floor.like_count, question_count: floor.question_count, replyToId: floor.reply_to_message_id })) });
    const state = Buffer.from(Y.encodeStateAsUpdate(doc)).toString("base64"); doc.destroy();
    const initialized = await db.rpc("initialize_forum_edit", { p_topic_id: id, p_state: state });
    if (initialized.error || !initialized.data) throw new ForumAccessError("协作文档初始化失败。", 503);
    document = initialized.data;
  }
  const ids = [...new Set([topic.data.creator_id, viewerId, ...(members.data ?? []).map(member => member.creator_id), ...(presence.data ?? []).map(member => member.creator_id)])];
  const profiles = await db.from("profiles").select("id,handle,display_name,avatar_asset_id").in("id", ids);
  if (profiles.error) throw new ForumAccessError("无法读取协作成员。", 503);
  return { document, ownerId: topic.data.creator_id, viewerId, status: topic.data.status, version: topic.data.version, accounts: accounts.data ?? [], members: profiles.data ?? [], presence: presence.data ?? [] };
}

export async function mergeForumEdit(db: DB, id: string, viewerId: string, update: string, publish = false) {
  const bytes = Buffer.from(update, "base64");
  if (!bytes.length || bytes.length > MAX_DOCUMENT_BYTES) throw new ForumAccessError("修改内容过大或格式无效。", 400);
  for (let attempt = 0; attempt < 6; attempt++) {
    const current = await readEditEnvelope(db, id, viewerId);
    const doc = new Y.Doc();
    try {
      Y.applyUpdate(doc, Buffer.from(current.document.state, "base64"));
      Y.applyUpdate(doc, bytes);
      if (current.document.first_id) doc.getMap("meta").set("firstId", current.document.first_id);
      const content = readForum(doc), parsed = publishableSnapshot(content);
      const state = Y.encodeStateAsUpdate(doc);
      if (state.length > MAX_DOCUMENT_BYTES) throw new ForumAccessError("协作文档已达大小上限，请保留内容后联系维护者。", 400);
      const { data, error } = await db.rpc("commit_forum_edit", {
        p_topic_id: id, p_expected_revision: current.document.revision,
        p_state: Buffer.from(state).toString("base64"), p_first_id: content.floors[0]?.id ?? null,
        p_snapshot: parsed.success ? parsed.data as unknown as Json : null, p_publish: publish,
      });
      if (error?.message.includes("FORUM_EDIT_CONFLICT")) continue;
      if (error || !data) throw new ForumAccessError(error?.message.includes("OWNER_REQUIRED") ? "只有作者可以首次发布作品。" : error?.message.includes("EDITOR_REQUIRED") ? "编辑权限已失效。当前内容仍保留。" : "修改未保存，请检查内容与权限后重试。", error?.message.includes("REQUIRED") ? 403 : 400);
      const result = await readEditEnvelope(db, id, viewerId);
      if (!parsed.success) result.document.publish_error = parsed.error.issues[0]?.message ?? "当前内容尚未完整。";
      return result;
    } catch (error) {
      if (error instanceof ForumAccessError) throw error;
      throw new ForumAccessError("修改格式不可用，当前输入仍保留，请重新连接后重试。", 400);
    } finally { doc.destroy(); }
  }
  throw new ForumAccessError("多人修改较密集，正在等待重试。当前输入仍保留。", 409);
}

export function forumRouteError(error: unknown) {
  return Response.json({ error: error instanceof ForumAccessError ? error.message : "连接中断，请保留内容后重试。" }, { status: error instanceof ForumAccessError ? error.status : 500, headers: { "Cache-Control": "no-store" } });
}
