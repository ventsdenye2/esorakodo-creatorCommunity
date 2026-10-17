import Link from "next/link";
import { GuideLink } from "../../../src/features/guide/guide-link";
import { redirect } from "next/navigation";
import { SiteHeader } from "../../../src/components/layout/site-header";
import { SiteFooter } from "../../../src/components/layout/site-footer";
import { createForumDraft } from "../../../src/features/forum/actions";
import { listEditableForumTopics } from "../../../src/features/forum/queries";
import { boardLabel } from "../../../src/features/forum/schemas";
import { getAuthenticatedCreatorId } from "../../../src/features/wiki/queries";
import { isSupabaseConfigured } from "../../../src/lib/supabase/config";
import "../../../src/features/forum/forum.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "创作论坛主题" };
export default async function CreateForumPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ error }, creatorId, drafts] = await Promise.all([searchParams, getAuthenticatedCreatorId(), listEditableForumTopics()]);
  if (isSupabaseConfigured() && !creatorId) redirect("/login");
  return <div><SiteHeader current="forum" /><main id="main-content" className="forum-shell forum-form-page">
    <nav className="forum-crumb"><Link href="/forum">校园论坛</Link><span>/</span>创作主题</nav>
    <p className="archive-label">CREATOR / FORUM</p><h1>创作论坛主题</h1>
    <p>先写下楼主的第一条消息，再让讨论自然发生。昵称和头像会自动准备好，随时可以改。</p>
    {error && <p className="forum-error" role="alert">{error}</p>}
    <form action={createForumDraft} className="forum-form forum-start-writing"><input type="hidden" name="title" value="未命名主题" /><input type="hidden" name="board" value="campus" /><button className="button button-primary" type="submit">开始写帖子</button><p className="forum-form-hint">也可以进入后，在“帖子设置与导入”中导入 Markdown。</p></form>
    <GuideLink section="forum">查看论坛创作说明</GuideLink>
    <section className="forum-drafts"><h2>我的帖子与协作</h2>{drafts.length === 0 ? <p>还没有帖子或协作邀请。</p> : <ul>{drafts.map((draft) => <li key={draft.id}><Link href={`/create/forum/${draft.id}`}><strong>{draft.title}</strong><span>{draft.creator_id !== creatorId ? "协作 · " : ""}{draft.status === "published" ? "已发布，可继续改写" : "草稿"} · {boardLabel(draft.board)} · {draft.floorCount} 层</span></Link></li>)}</ul>}</section>
  </main><SiteFooter /></div>;
}
