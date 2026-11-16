import Link from "next/link";
import { SiteHeader } from "../../../src/components/layout/site-header";
import { SiteFooter } from "../../../src/components/layout/site-footer";
import { listPublishedTopics } from "../../../src/features/forum/queries";
import { forumBoards } from "../../../src/features/forum/schemas";
import { TopicCards } from "../../../src/features/forum/topic-cards";
import "../../../src/features/forum/forum.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "校园论坛" };

export default async function ForumPage({ searchParams }: { searchParams: Promise<{ board?: string; tag?: string }> }) {
  const { board, tag } = await searchParams;
  const activeBoard = forumBoards.some((item) => item.id === board) ? board : undefined;
  const activeTag = tag?.slice(0, 64);
  const topics = await listPublishedTopics(activeBoard, activeTag);
  return <div><SiteHeader current="forum" /><main id="main-content" className="forum-shell forum-index">
    <header className="forum-heading" data-motion><div><p className="archive-label">CAMPUS / FORUM</p><h1>校园论坛</h1><p>以不同校园身份共同讲述的讨论作品。</p></div><Link className="button button-primary" href="/create/forum">创作主题</Link></header>
    <nav className="forum-boards" aria-label="论坛版面"><Link href="/forum" aria-current={!activeBoard ? "page" : undefined}>全部版面</Link>{forumBoards.map((item) => <Link key={item.id} href={`/forum?board=${item.id}`} aria-current={activeBoard === item.id ? "page" : undefined}>{item.label}</Link>)}</nav>
    {activeTag && <p className="forum-filter">标签：#{activeTag} <Link href={activeBoard ? `/forum?board=${activeBoard}` : "/forum"}>清除筛选</Link></p>}
    <section className="forum-discovery" aria-label="主题列表">
      {topics.length === 0 ? <div className="forum-empty"><h2>这里还没有公开主题</h2><p>选择其他版面或标签，或者从一个新的校园讨论开始。</p><Link href="/create/forum">创作主题 →</Link></div> : <TopicCards topics={topics} board={activeBoard} tag={activeTag} />}
    </section>
  </main><SiteFooter /></div>;
}
