"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "../../lib/supabase/server";
import { forumAccountSchema } from "./schemas";

export async function createForumAccount(formData: FormData) {
  const parsed = forumAccountSchema.safeParse({
    handle: formData.get("handle"), displayName: formData.get("displayName"),
    accountType: formData.get("accountType"), studentId: formData.get("studentId"),
    signature: formData.get("signature"),
  });
  const errorPath = "/create/forum/account";
  if (!parsed.success) redirect(`${errorPath}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "账号信息无效。")}`);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await supabase.from("forum_accounts").insert({
    handle: parsed.data.handle,
    display_name: parsed.data.displayName,
    account_type: parsed.data.accountType,
    student_id: parsed.data.accountType === "student" ? parsed.data.studentId : null,
    signature: parsed.data.signature,
    created_by: user.id,
  });
  if (error) redirect(`${errorPath}?error=${encodeURIComponent(error.code === "23505" ? "账号标识已被使用。" : "创建失败，请稍后重试。")}`);
  revalidatePath("/create/forum");
  redirect(`/forum/accounts/${encodeURIComponent(parsed.data.handle)}`);
}

export async function updateForumAccount(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const parsed = forumAccountSchema.safeParse({
    handle: formData.get("handle"), displayName: formData.get("displayName"),
    accountType: formData.get("accountType"), studentId: formData.get("studentId"),
    signature: formData.get("signature"),
  });
  const errorPath = `/create/forum/account/${encodeURIComponent(id)}`;
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/create/forum");
  if (!parsed.success) redirect(`${errorPath}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "账号信息无效。")}`);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await supabase.from("forum_accounts").update({
    handle: parsed.data.handle, display_name: parsed.data.displayName,
    account_type: parsed.data.accountType,
    student_id: parsed.data.accountType === "student" ? parsed.data.studentId : null,
    signature: parsed.data.signature,
  }).eq("id", id).eq("created_by", user.id);
  if (error) redirect(`${errorPath}?error=${encodeURIComponent(error.code === "23505" ? "账号标识已被使用。" : "更新失败，请稍后重试。")}`);
  revalidatePath("/create/forum");
  redirect(`/forum/accounts/${encodeURIComponent(parsed.data.handle)}`);
}
