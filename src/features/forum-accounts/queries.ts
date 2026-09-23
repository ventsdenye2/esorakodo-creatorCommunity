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
