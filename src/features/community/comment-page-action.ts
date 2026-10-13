"use server";
import { z } from "zod";
import { readCommentPage, type CommentPage } from "./comment-pages";
import { workKinds } from "./types";

const schema = z.object({ kind: z.enum(workKinds), id: z.uuid(), cursor: z.object({ id: z.uuid(), created_at: z.iso.datetime({ offset: true }) }) });
export async function loadOlderComments(input: unknown): Promise<CommentPage> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { comments: [], hasMore: false, error: "评论分页信息无效，请刷新页面。" };
  return readCommentPage(parsed.data.kind, parsed.data.id, parsed.data.cursor);
}
