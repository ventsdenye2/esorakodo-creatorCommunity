"use server";
import { createClient } from "../../lib/supabase/server";
import { revalidatePath } from "next/cache";
import { parseForum } from "./parse";

export async function prepareForumImportAccounts(raw: string) {
  let parsed;
  try { parsed = parseForum(raw); } catch (e) { return { error: e instanceof Error ? e.message : "格式无效。", accounts: [] }; }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "请先登录，再重新导入。", accounts: [] };
  const { data: owned, error: readError } = await supabase.from("forum_accounts").select("*").eq("created_by", user.id);
  if (readError) return { error: "无法读取论坛身份，请稍后重试。", accounts: [] };
  const existing = owned ?? [];
  const missing = parsed.identities.filter(identity => !existing.some(a => a.handle === identity.handle));
  if (!missing.length) return { error: null, accounts: existing };
  // One INSERT is atomic: a conflicting handle cannot leave a partial batch behind.
  const { data: created, error } = await supabase.from("forum_accounts").insert(missing.map(identity => ({ ...identity, account_type: "unknown" as const, student_id: null, created_by: user.id }))).select("*");
  if (error) return { error: error.code === "23505" ? "有账号标识已被占用。若刚刚重试过导入，请再试一次；否则修改文件中的账号标识。此次未创建任何新身份。" : "创建论坛身份失败，请稍后重试。", accounts: [] };
  revalidatePath("/create/forum");
  return { error: null, accounts: [...existing, ...(created ?? [])] };
}
