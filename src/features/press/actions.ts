"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { articleSchema } from "./schemas";

export type ArticleSaveState = { error: string | null; saved: boolean; id: string | null; version: number | null };
export async function saveArticle(previous: ArticleSaveState, form: FormData): Promise<ArticleSaveState> {
  let body: unknown;
  try { body = JSON.parse(String(form.get("body") ?? "")); } catch { return { ...previous, saved: false, error: "正文格式无法读取，请检查后重试。" }; }
  const parsed = articleSchema.safeParse({ id: previous.id, version: previous.version, title: form.get("title"), summary: form.get("summary"), body, tags: [...new Set(String(form.get("tags") ?? "").split(/[,，]/).map((tag) => tag.trim()).filter(Boolean))], publish: form.get("intent") === "publish" });
  if (!parsed.success) return { ...previous, saved: false, error: parsed.error.issues[0]?.message ?? "请检查文章内容。" };
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return { ...previous, saved: false, error: "登录状态已过期，请在新标签页登录后再保存。当前内容仍保留在此页。" };
  const article = parsed.data;
  const { data: id, error } = await client.rpc("save_article", { p_id: article.id, p_expected_version: article.version, p_title: article.title, p_summary: article.summary, p_body: article.body, p_tags: article.tags, p_publish: article.publish });
  if (error || !id) {
    const message = error?.message ?? "";
    return { ...previous, saved: false, error: message.includes("VERSION_CONFLICT") ? "这篇文章已在别处修改。请复制保留当前内容，重新载入最新版本后再保存。" : message.includes("FORBIDDEN") || message.includes("NOT_FOUND") ? "文章不存在、已隐藏或无权编辑。" : message.includes("INVALID") ? "保存未完成，请检查标签、正文与引用档案是否有效。" : "文章保存失败，请稍后重试。当前内容未丢失。" };
  }
  revalidatePath("/press"); revalidatePath("/"); revalidatePath("/creator"); revalidatePath(`/press/${id}`); revalidatePath(`/create/article/${id}`);
  if (article.publish) redirect(`/press/${id}`);
  if (!previous.id) redirect(`/create/article/${id}?saved=1`);
  return { id, version: (previous.version ?? 0) + 1, error: null, saved: true };
}
