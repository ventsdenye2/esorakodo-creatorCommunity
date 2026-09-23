import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "../../../src/components/layout/site-header";
import { SiteFooter } from "../../../src/components/layout/site-footer";
import { createForumDraft } from "../../../src/features/forum/actions";
import { listOwnDrafts } from "../../../src/features/forum/queries";
import { forumBoards, boardLabel } from "../../../src/features/forum/schemas";
import { listOwnForumAccounts } from "../../../src/features/forum-accounts/queries";
import { getAuthenticatedCreatorId } from "../../../src/features/wiki/queries";
import { isSupabaseConfigured } from "../../../src/lib/supabase/config";
import "../../../src/features/forum/forum.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "创作论坛主题" };
export default async function CreateForumPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ error }, creatorId, accounts, drafts] = await Promise.all([searchParams, getAuthenticatedCreatorId(), listOwnForumAccounts(), listOwnDrafts()]);
  if (isSupabaseConfigured() && !creatorId) redirect("/login");
  return <div><SiteHeader current="forum" /><main id="main-content" className="forum-shell forum-form-page">
    <nav className="forum-crumb"><Link href="/forum">校园论坛</Link><span>/</span>创作主题</nav>
    <p className="archive-label">CREATOR / FORUM</p><h1>创作论坛主题</h1>
    <p>以 Forum Account 编排戏内讨论。主题由你的 Creator 账号管理，发布后公开阅读。</p>
    {error && <p className="forum-error" role="alert">{error}</p>}
    {accounts.length === 0 ? <section className="forum-empty-note"><h2>先建立一个发言身份</h2><p>一个 Creator 可以为不同角色建立多个论坛身份。</p><Link className="button button-primary" href="/create/forum/account">建立 Forum Account</Link></section> : <>
      <div className="forum-account-strip"><span>可用身份 {accounts.length}</span>{accounts.map((account) => <Link key={account.id} href={`/forum/accounts/${account.handle}`}>@{account.handle}</Link>)}<Link href="/create/forum/account">＋ 添加身份</Link></div>
      <form action={createForumDraft} className="forum-form forum-new-topic"><label>主题标题<input name="title" maxLength={160} required /></label><label>版面<select name="board">{forumBoards.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><button className="button button-primary" type="submit">建立草稿并编排楼层</button></form>
    </>}
    <section className="forum-drafts"><h2>我的草稿</h2>{drafts.length === 0 ? <p>目前没有草稿。</p> : <ul>{drafts.map((draft) => <li key={draft.id}><Link href={`/create/forum/${draft.id}`}><strong>{draft.title}</strong><span>{boardLabel(draft.board)} · {draft.floorCount} 层 · {new Date(draft.updated_at).toLocaleDateString("zh-CN")}</span></Link></li>)}</ul>}</section>
  </main><SiteFooter /></div>;
}
