"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "../../lib/supabase/config";
import { createClient } from "../../lib/supabase/server";
import { createWikiEntitySchema, rollbackWikiRevisionSchema, updateWikiEntitySchema } from "./schemas";
import { getWikiEntityHref } from "./types";

function formValue(formData: FormData, name: string) {
  return formData.get(name);
}

function withMessage(path: string, key: "error" | "message", message: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

function wikiErrorMessage(error: { code?: string; message: string }) {
  if (error.code === "23505") return "Slug 已被使用，请选择另一个稳定地址。";
  if (error.message.includes("WIKI_VERSION_CONFLICT")) return "档案已被其他人更新，请重新载入后再编辑。";
  if (error.message.includes("AUTH_REQUIRED")) return "请先登录 Creator 账号。";
  if (error.message.includes("CREATOR_PROFILE_REQUIRED")) return "请先完成 Creator 档案后再编辑校园档案。";
  if (error.message.includes("WIKI_ENTITY_NOT_FOUND")) return "档案不存在或已经不可用。";
  if (error.message.includes("WIKI_SUMMARY_REQUIRED")) return "请填写本次修改说明。";
  return "保存失败，请检查输入后重试。";
}

async function requireClient(path: string) {
  if (!isSupabaseConfigured()) {
    withMessage(path, "error", "Supabase 尚未配置，暂时无法写入档案。");
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?error=${encodeURIComponent("请先登录后再编辑校园档案。")}`);
  return supabase;
}

export async function createWikiEntity(formData: FormData) {
  const parsed = createWikiEntitySchema.safeParse({
    entityType: formValue(formData, "entityType"),
    slug: formValue(formData, "slug"),
    name: formValue(formData, "name"),
    summary: formValue(formData, "summary"),
    collegeId: formValue(formData, "collegeId"),
    signature: formValue(formData, "signature"),
  });
  if (!parsed.success) {
    withMessage("/create/wiki", "error", parsed.error.issues[0]?.message ?? "档案信息无效。");
  }

  const supabase = await requireClient("/create/wiki");
  const { error } = await supabase.rpc("create_wiki_entity", {
    p_entity_type: parsed.data.entityType,
    p_slug: parsed.data.slug,
    p_name: parsed.data.name,
    p_summary: parsed.data.summary ?? null,
    p_college_id: parsed.data.collegeId ?? null,
    p_signature: parsed.data.signature ?? null,
  });
  if (error) withMessage("/create/wiki", "error", wikiErrorMessage(error));

  const href = getWikiEntityHref(parsed.data.entityType, parsed.data.slug);
  revalidatePath("/wiki");
  revalidatePath(href);
  redirect(`${href}?message=${encodeURIComponent("档案已创建，并记录首个 Revision。")}`);
}

export async function updateWikiEntity(formData: FormData) {
  const parsed = updateWikiEntitySchema.safeParse({
    entityType: formValue(formData, "entityType"),
    entityId: formValue(formData, "entityId"),
    slug: formValue(formData, "slug"),
    expectedVersion: formValue(formData, "expectedVersion"),
    name: formValue(formData, "name"),
    summary: formValue(formData, "summary"),
    collegeId: formValue(formData, "collegeId"),
    signature: formValue(formData, "signature"),
    editSummary: formValue(formData, "editSummary"),
  });
  const fallback = "/wiki";
  if (!parsed.success) {
    withMessage(fallback, "error", parsed.error.issues[0]?.message ?? "档案修改无效。");
  }

  const href = getWikiEntityHref(parsed.data.entityType, parsed.data.slug);
  const supabase = await requireClient(`${href}/edit`);
  const patch: Record<string, string | null> = {
    name: parsed.data.name,
    summary: parsed.data.summary ?? null,
  };
  if (parsed.data.entityType !== "college") patch.college_id = parsed.data.collegeId ?? null;
  if (parsed.data.entityType === "student") patch.signature = parsed.data.signature ?? null;

  const { error } = await supabase.rpc("apply_wiki_revision", {
    p_entity_type: parsed.data.entityType,
    p_entity_id: parsed.data.entityId,
    p_expected_version: parsed.data.expectedVersion,
    p_patch: patch,
    p_summary: parsed.data.editSummary,
    p_source_work_id: null,
  });
  if (error) withMessage(`${href}/edit`, "error", wikiErrorMessage(error));

  revalidatePath("/wiki");
  revalidatePath(href);
  revalidatePath(`${href}/history`);
  redirect(`${href}?message=${encodeURIComponent("档案已更新，Revision 已保存。")}`);
}

export async function rollbackWikiRevision(formData: FormData) {
  const parsed = rollbackWikiRevisionSchema.safeParse({
    revisionId: formValue(formData, "revisionId"),
    entityType: formValue(formData, "entityType"),
    slug: formValue(formData, "slug"),
    expectedVersion: formValue(formData, "expectedVersion"),
  });
  if (!parsed.success) withMessage("/wiki", "error", "回滚请求无效。");

  const href = getWikiEntityHref(parsed.data.entityType, parsed.data.slug);
  const supabase = await requireClient(`${href}/history`);
  const { error } = await supabase.rpc("rollback_wiki_revision", {
    p_revision_id: parsed.data.revisionId,
    p_expected_version: parsed.data.expectedVersion,
    p_summary: "从历史 Revision 回滚",
  });
  if (error) withMessage(`${href}/history`, "error", wikiErrorMessage(error));

  revalidatePath("/wiki");
  revalidatePath(href);
  revalidatePath(`${href}/history`);
  redirect(`${href}?message=${encodeURIComponent("已回滚并创建新的 Revision。")}`);
}
