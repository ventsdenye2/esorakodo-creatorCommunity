import { z } from "zod";
import { notFound, redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { isSupabaseConfigured } from "../../lib/supabase/config";

const previewSchema = z.object({ report_id: z.uuid(), target_id: z.uuid(), kind: z.enum(["forum", "article", "event", "supplement"]), title: z.string(), status: z.string(), creator_name: z.string(), excerpt: z.string().max(12000), public_path: z.string().nullable() });
export const workKindLabels = { forum: "论坛主题", article: "校刊文章", event: "事件档案", supplement: "事件补充" };
export const contentStatusLabels: Record<string, string> = { draft: "草稿", published: "已公开", hidden: "已隐藏" };
export const reportStatusLabels: Record<string, string> = { open: "待处理", resolved: "已处理", dismissed: "不予处理" };
export const moderationActionLabels: Record<string, string> = { hide: "隐藏", restore: "恢复", dismiss: "不予处理" };

export async function getModerationClient() {
  if (!isSupabaseConfigured()) notFound();
  const db = await createClient();
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError || !user) redirect("/login");
  const { data: allowed, error } = await db.rpc("is_moderator");
  if (error) throw new Error("无法核验管理权限，请稍后重试。");
  if (!allowed) notFound();
  return db;
}

export async function getReportReview(id: string) {
  const db = await getModerationClient();
  if (!z.uuid().safeParse(id).success) notFound();
  const [report, preview, audit] = await Promise.all([
    db.from("reports").select("*").eq("id", id).maybeSingle(),
    db.rpc("get_report_preview", { p_report_id: id }),
    db.from("moderation_actions").select("*,profiles!moderation_actions_moderator_id_fkey(display_name)").eq("report_id", id).order("created_at", { ascending: false }),
  ]);
  if (report.error || audit.error) throw new Error("举报与处置记录读取失败，请重试。");
  if (!report.data) notFound();
  if (preview.error) {
    if (preview.error.code === "42501") notFound();
    throw new Error("目标内容片段读取失败，请重试后再处置。");
  }
  const parsed = previewSchema.safeParse(preview.data);
  if (!parsed.success) throw new Error("目标内容片段格式异常，请重试后再处置。");
  return { report: report.data, preview: parsed.data, audit: audit.data ?? [] };
}
