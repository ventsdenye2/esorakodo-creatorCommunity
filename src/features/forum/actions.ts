"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { forumDraftSchema, forumTopicSchema } from "./schemas";

export type ForumSaveState = { error: string | null; saved: boolean };
const initialError = "保存失败，请稍后重试。";

function forumError(error: { code?: string; message: string }) {
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

export async function saveForumDraft(topicId: string, _: ForumSaveState, formData: FormData): Promise<ForumSaveState> {
  let messages: unknown;
  try { messages = JSON.parse(String(formData.get("messages") ?? "")); }
  catch { return { error: "楼层数据无效，请重新载入。", saved: false }; }
  const tags = String(formData.get("tags") ?? "").split(/[,，]/).map((tag) => tag.replace(/^#/, "").trim()).filter(Boolean);
  const parsed = forumDraftSchema.safeParse({
    title: formData.get("title"), board: formData.get("board"), tags, messages,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "草稿信息无效。", saved: false };
  if (parsed.data.messages.some((message, index) => message.reply_to_floor_no !== null && message.reply_to_floor_no >= index + 1)) {
    return { error: "回复目标必须是此前的楼层。", saved: false };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "请先登录后再保存。", saved: false };
  const { data: topic, error: readError } = await supabase.from("forum_topics").select("creator_id,status")
    .eq("id", topicId).maybeSingle();
  if (readError || topic?.creator_id !== user.id || topic.status !== "draft") {
    return { error: "草稿不存在或无权编辑。", saved: false };
  }
  const accountIds = [...new Set(parsed.data.messages.map((message) => message.forum_account_id))];
  if (accountIds.length) {
    const { data: accounts, error: accountError } = await supabase.from("forum_accounts")
      .select("id").eq("created_by", user.id).in("id", accountIds);
    if (accountError || accounts?.length !== accountIds.length) return { error: "楼层只能使用自己的论坛身份。", saved: false };
  }
  const { error: floorError } = await supabase.rpc("replace_forum_draft_messages", {
    p_topic_id: topicId,
    p_messages: parsed.data.messages.map((message) => ({
      forum_account_id: message.forum_account_id,
      body: message.body,
      reply_to_floor_no: message.reply_to_floor_no,
      in_world_time: message.in_world_time || null,
    })),
  });
  if (floorError) return { error: forumError(floorError), saved: false };

  const { error: topicError } = await supabase.from("forum_topics").update({
    title: parsed.data.title, board: parsed.data.board,
  }).eq("id", topicId).eq("creator_id", user.id).eq("status", "draft");
  if (topicError) return { error: `楼层已保存，但主题信息未更新。请重新载入草稿后重试。${forumError(topicError)}`, saved: true };
  const { error: tagError } = await supabase.rpc("replace_forum_draft_hashtags", {
    p_topic_id: topicId, p_names: [...new Set(parsed.data.tags)],
  });
  if (tagError) return { error: `楼层与主题已保存，但标签未更新。请重新载入草稿后重试。${forumError(tagError)}`, saved: true };
  revalidatePath("/forum");
  revalidatePath(`/create/forum/${topicId}`);

  if (formData.get("intent") === "publish") {
    const { error: publishError } = await supabase.rpc("publish_forum_topic", { p_topic_id: topicId });
    if (publishError) return { error: forumError(publishError), saved: true };
    revalidatePath(`/forum/${topicId}`);
    redirect(`/forum/${topicId}?message=${encodeURIComponent("主题已发布。")}`);
  }
  return { error: null, saved: true };
}
