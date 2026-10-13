"use client";
import Link from "next/link";
import { useState } from "react";
import { loadOlderComments } from "./comment-page-action";
import type { CommentPage } from "./comment-pages";
import type { WorkKind } from "./types";
import { RemoveComment } from "./work-actions";

export function CommentList({ initial, kind, id, userId }: { initial: CommentPage; kind: WorkKind; id: string; userId?: string }) {
  const [page, setPage] = useState(initial);
  const [pending, setPending] = useState(false);
  async function load() {
    const cursor = page.comments.at(-1);
    if (!cursor || pending) return;
    setPending(true);
    try {
      const older = await loadOlderComments({ kind, id, cursor: { id: cursor.id, created_at: cursor.created_at } });
      if (older.error) setPage(current => ({ ...current, error: older.error }));
      else setPage(current => ({ ...older, comments: [...current.comments, ...older.comments.filter(comment => !current.comments.some(item => item.id === comment.id))] }));
    } catch { setPage(current => ({ ...current, error: "评论暂时无法加载，请稍后重试。" })); }
    finally { setPending(false); }
  }
  return <div>{page.error && <p role="alert">{page.error}</p>}{page.hasMore && <button type="button" disabled={pending} onClick={() => void load()}>{pending ? "正在加载…" : "加载更早评论"}</button>}
    <ol className="work-comments">{[...page.comments].reverse().map(comment => <li key={comment.id}><div>{comment.profiles ? <Link href={`/creator/${comment.profiles.handle}`}>{comment.profiles.display_name}</Link> : <span>作者资料暂不可用</span>}<time dateTime={comment.created_at}>{new Date(comment.created_at).toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" })}</time></div><p>{comment.body}</p>{userId === comment.creator_id && <RemoveComment kind={kind} id={comment.id} />}</li>)}</ol>
    {!page.comments.length && !page.error && <p className="muted">还没有作品评论。</p>}
  </div>;
}
