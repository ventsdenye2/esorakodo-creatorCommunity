import { createClient } from "../../lib/supabase/server";
import { workColumns, type WorkKind } from "./types";

export type WorkComment = {
  id: string; creator_id: string; body: string; created_at: string;
  profiles: { handle: string; display_name: string } | null;
};
export type CommentPage = { comments: WorkComment[]; hasMore: boolean; error: string | null };
export async function readCommentPage(kind: WorkKind, id: string, cursor?: { created_at: string; id: string }): Promise<CommentPage> {
  const db = await createClient();
  let query = db.from("work_comments").select("id,creator_id,body,created_at,profiles(handle,display_name)").eq(workColumns[kind], id);
  if (cursor) query = query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
  const { data, error } = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).limit(51);
  if (error) return { comments: [], hasMore: false, error: "评论暂时无法加载，请稍后重试。" };
  return { comments: (data ?? []).slice(0, 50), hasMore: (data?.length ?? 0) > 50, error: null };
}
