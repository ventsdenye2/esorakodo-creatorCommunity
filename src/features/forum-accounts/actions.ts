"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "../../lib/supabase/server";
import { forumAccountSchema } from "./schemas";

export type ForumAccountSaveState = { error: string | null };
export async function createForumAccount(_: ForumAccountSaveState, formData: FormData): Promise<ForumAccountSaveState> {
  const parsed = forumAccountSchema.safeParse({
    handle: formData.get("handle"), displayName: formData.get("displayName"),
    accountType: formData.get("accountType"), studentId: formData.get("studentId"),
    signature: formData.get("signature"), avatarAssetId: formData.get("avatar_asset_id"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "账号信息无效。" };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "登录已过期，请在新标签页登录后返回重试；当前输入仍然保留。" };
  const { error } = await supabase.from("forum_accounts").insert({
    handle: parsed.data.handle,
    display_name: parsed.data.displayName,
    account_type: parsed.data.accountType,
    student_id: parsed.data.studentId,
    signature: parsed.data.signature, avatar_asset_id: parsed.data.avatarAssetId,
    created_by: user.id,
  });
  if (error) return { error: error.code === "23505" ? "账号标识已被使用。" : "创建失败，请稍后重试。" };
  revalidatePath("/create/forum");
  redirect(`/forum/accounts/${encodeURIComponent(parsed.data.handle)}`);
}

export async function updateForumAccount(_: ForumAccountSaveState, formData: FormData): Promise<ForumAccountSaveState> {
  const id = String(formData.get("id") ?? "");
  const parsed = forumAccountSchema.safeParse({
    handle: formData.get("handle"), displayName: formData.get("displayName"),
    accountType: formData.get("accountType"), studentId: formData.get("studentId"),
    signature: formData.get("signature"), avatarAssetId: formData.get("avatar_asset_id"),
  });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: "账号信息无效，请重新打开编辑页面。" };
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "账号信息无效。" };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "登录已过期，请在新标签页登录后返回重试；当前输入仍然保留。" };
  const { data: updated, error } = await supabase.from("forum_accounts").update({
    handle: parsed.data.handle, display_name: parsed.data.displayName,
    account_type: parsed.data.accountType,
    student_id: parsed.data.studentId,
    signature: parsed.data.signature, avatar_asset_id: parsed.data.avatarAssetId,
  }).eq("id", id).eq("created_by", user.id).select("id").maybeSingle();
  if (error || !updated) return { error: error?.code === "23505" ? "账号标识已被使用。" : "账号不存在、无权编辑或保存失败。" };
  revalidatePath("/create/forum");
  redirect(`/forum/accounts/${encodeURIComponent(parsed.data.handle)}`);
}
