import { isSupabaseConfigured } from "../../lib/supabase/config";
import { createClient } from "../../lib/supabase/server";
import type { Database, ForumAccount, Student } from "../../types/database";

export type ForumTopic = Database["public"]["Tables"]["forum_topics"]["Row"];
export type ForumMessage = Database["public"]["Tables"]["forum_messages"]["Row"];
export type ForumTopicView = ForumTopic & { floorCount: number; tags: string[] };
export type ForumFloor = ForumMessage & { account: ForumAccount; replyFloor: number | null };

export async function getWikiEntityById(id: string): Promise<Student | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("students").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function listPublishedTopicsForStudent(studentId: string): Promise<ForumTopic[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data: accounts, error: accountError } = await supabase.from("forum_accounts")
    .select("id").eq("student_id", studentId);
  if (accountError) throw new Error(accountError.message);
  if (!accounts?.length) return [];
  const { data: messages, error: messageError } = await supabase.from("forum_messages")
    .select("topic_id").in("forum_account_id", accounts.map((account) => account.id));
  if (messageError) throw new Error(messageError.message);
  const ids = [...new Set((messages ?? []).map((message) => message.topic_id))];
  if (!ids.length) return [];
  const { data, error } = await supabase.from("forum_topics").select("*")
    .in("id", ids).eq("status", "published").order("published_at", { ascending: false }).limit(20);
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function enrichTopics(topics: ForumTopic[]): Promise<ForumTopicView[]> {
  if (!topics.length) return [];
  const supabase = await createClient();
  const ids = topics.map((topic) => topic.id);
  const [messages, links] = await Promise.all([
    supabase.from("forum_messages").select("topic_id").in("topic_id", ids),
    supabase.from("forum_topic_hashtags").select("topic_id, hashtags(name)").in("topic_id", ids),
  ]);
  if (messages.error || links.error) throw new Error(messages.error?.message ?? links.error?.message);
  return topics.map((topic) => ({
    ...topic,
    floorCount: (messages.data ?? []).filter((message) => message.topic_id === topic.id).length,
    tags: (links.data ?? []).filter((link) => link.topic_id === topic.id)
      .map((link) => link.hashtags?.name).filter((name): name is string => Boolean(name)),
  }));
}

export async function listPublishedTopics(board?: string, tag?: string): Promise<ForumTopicView[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  let taggedIds: string[] | null = null;
  if (tag) {
    const normalized = tag.trim().replace(/\s+/g, " ").toLocaleLowerCase();
    const { data: hashtag, error: hashtagError } = await supabase.from("hashtags")
      .select("id").eq("normalized_name", normalized).maybeSingle();
    if (hashtagError) throw new Error(hashtagError.message);
    if (!hashtag) return [];
    const { data: links, error: linkError } = await supabase.from("forum_topic_hashtags")
      .select("topic_id").eq("hashtag_id", hashtag.id);
    if (linkError) throw new Error(linkError.message);
    taggedIds = (links ?? []).map((link) => link.topic_id);
    if (!taggedIds.length) return [];
  }
  let query = supabase.from("forum_topics").select("*").eq("status", "published")
    .order("published_at", { ascending: false }).limit(50);
  if (board) query = query.eq("board", board);
  if (taggedIds) query = query.in("id", taggedIds);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return enrichTopics(data ?? []);
}

export async function listOwnDrafts(): Promise<ForumTopicView[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase.from("forum_topics").select("*")
    .eq("creator_id", user.id).eq("status", "draft").order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return enrichTopics(data ?? []);
}

export async function getForumTopic(id: string, draft = false): Promise<{ topic: ForumTopicView; floors: ForumFloor[] } | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  let query = supabase.from("forum_topics").select("*").eq("id", id);
  if (!draft) query = query.eq("status", "published");
  const { data: topic, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  if (!topic) return null;
  const [messages, topicView] = await Promise.all([
    supabase.from("forum_messages").select("*").eq("topic_id", id).order("floor_no"),
    enrichTopics([topic]),
  ]);
  if (messages.error) throw new Error(messages.error.message);
  const accountIds = [...new Set((messages.data ?? []).map((message) => message.forum_account_id))];
  const accounts = accountIds.length ? await supabase.from("forum_accounts").select("*").in("id", accountIds) : null;
  if (accounts?.error) throw new Error(accounts.error.message);
  const accountMap = new Map((accounts?.data ?? []).map((account) => [account.id, account]));
  const floorMap = new Map((messages.data ?? []).map((message) => [message.id, message.floor_no]));
  const floors = (messages.data ?? []).flatMap((message) => {
    const account = accountMap.get(message.forum_account_id);
    return account ? [{ ...message, account, replyFloor: message.reply_to_message_id ? floorMap.get(message.reply_to_message_id) ?? null : null }] : [];
  });
  return { topic: topicView[0], floors };
}
