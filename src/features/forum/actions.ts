"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { forumDraftSchema, forumTopicSchema } from "./schemas";

export type ForumSaveState = { error: string | null; saved: boolean; version: number };
const initialError = "保存失败，请稍后重试。";

function forumError(error: { code?: string; message: string }) {
  if (error.message.includes("FORUM_VERSION_CONFLICT")) return "这份草稿已在别处更新。请复制保留当前内容，重新载入最新版本后再保存。";
  if (error.message.includes("FORUM_LINKS_INVALID")) return "关联档案已不可用，请重新选择后保存。";
  if (error.message.includes("FORUM_TOPIC_INVALID")) return "主题标题或版面无效，请检查后再保存。";
  if (error.message.includes("FORUM_TOPIC_NOT_OWNED")) return "只能编辑自己的草稿。";
  if (error.message.includes("FORUM_TOPIC_NOT_DRAFT")) return "主题已发布，不能修改历史楼层。";
  if (error.message.includes("FORUM_ACCOUNT_NOT_OWNED")) return "楼层只能使用自己的论坛身份。";
  if (error.message.includes("FORUM_TOPIC_EMPTY")) return "至少写一个楼层才能发布。";
  if (error.message.includes("FORUM_REPLY_INVALID")) return "回复目标必须是本主题此前的楼层。";
  if (error.message.includes("FORUM_MESSAGES_INVALID") || error.message.includes("FORUM_MESSAGE_INVALID")) return "楼层信息无效，请检查内容。";
  if (error.message.includes("FORUM_HASHTAGS_INVALID") || error.message.includes("FORUM_HASHTAG_INVALID")) return "标签无效，请检查长度和数量。";
  return initialError;
}

export async function createForumDraft(formData: FormData) {
  const parsed = forumTopicSchema.safeParse({ title: formData.get("title"), board: formData.get("board") });
  if (!parsed.success) redirect(`/create/forum?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "主题信息无效。")}`);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await supabase.from("forum_topics").insert({
    creator_id: user.id, title: parsed.data.title, board: parsed.data.board,
  }).select("id").single();
  if (error || !data) redirect(`/create/forum?error=${encodeURIComponent(initialError)}`);
  revalidatePath("/forum");
  redirect(`/create/forum/${data.id}`);
}

export async function saveForumDraft(topicId: string, previous: ForumSaveState, formData: FormData): Promise<ForumSaveState> {
  const fail = (error: string): ForumSaveState => ({ ...previous, error, saved: false });
  let messages: unknown; let links: unknown;
  try { messages = JSON.parse(String(formData.get("messages") ?? "")); links = JSON.parse(String(formData.get("links") ?? "[]")); }
  catch { return fail("草稿内容无法读取，请检查后重试。"); }
  const tags = String(formData.get("tags") ?? "").split(/[,，]/).map((tag) => tag.replace(/^#/, "").trim()).filter(Boolean);
  const parsed = forumDraftSchema.safeParse({ title: formData.get("title"), board: formData.get("board"), tags, messages, links });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "草稿信息无效。");
  if (parsed.data.messages.some((message, index) => message.reply_to_floor_no !== null && message.reply_to_floor_no >= index + 1)) return fail("回复目标必须是此前的楼层。");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail("请先登录后再保存。当前输入仍保留在页面中。");
  const publish = formData.get("intent") === "publish";
  const { data: version, error } = await supabase.rpc("save_forum_draft", {
    p_topic_id: topicId, p_expected_version: previous.version,
    p_title: parsed.data.title, p_board: parsed.data.board,
    p_messages: parsed.data.messages.map((message) => ({ ...message, in_world_time: message.in_world_time || null })),
    p_tags: [...new Set(parsed.data.tags)], p_links: parsed.data.links, p_publish: publish,
  });
  if (error || version === null) return fail(error ? forumError(error) : initialError);
  revalidatePath("/forum"); revalidatePath("/"); revalidatePath("/creator"); revalidatePath("/wiki"); revalidatePath(`/create/forum/${topicId}`);
  if (publish) { revalidatePath(`/forum/${topicId}`); redirect(`/forum/${topicId}`); }
  return { error: null, saved: true, version };
}
