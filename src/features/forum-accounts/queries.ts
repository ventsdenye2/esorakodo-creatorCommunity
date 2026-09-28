import { isSupabaseConfigured } from "../../lib/supabase/config";
import { createClient } from "../../lib/supabase/server";
import type { ForumAccount } from "../../types/database";

export async function listOwnForumAccounts(): Promise<ForumAccount[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase.from("forum_accounts")
    .select("*").eq("created_by", user.id).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getForumAccount(handle: string): Promise<ForumAccount | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("forum_accounts")
    .select("*").eq("handle", handle).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function listTopicsForAccount(accountId: string) {
  if (!isSupabaseConfigured()) return [];
  const db=await createClient();
  const {data:messages,error}=await db.from('forum_messages').select('topic_id').eq('forum_account_id',accountId).limit(500);
  if(error)throw new Error(error.message);
  const ids=[...new Set((messages??[]).map(message=>message.topic_id))];
  if(!ids.length)return [];
  const result=await db.from('forum_topics').select('id,title,published_at').in('id',ids).eq('status','published').order('published_at',{ascending:false}).limit(50);
  if(result.error)throw new Error(result.error.message);
  return result.data??[];
}
