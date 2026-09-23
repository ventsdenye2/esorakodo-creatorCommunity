import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../../../src/components/layout/site-header";
import { SiteFooter } from "../../../../src/components/layout/site-footer";
import { getForumTopic } from "../../../../src/features/forum/queries";
import { boardLabel } from "../../../../src/features/forum/schemas";
import "../../../../src/features/forum/forum.css";

export const dynamic = "force-dynamic";
export default async function ForumTopicPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ message?: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [{ message }, result] = await Promise.all([searchParams, getForumTopic(id)]);
  if (!result) notFound();
  return <div><SiteHeader current="forum" /><main id="main-content" className="forum-shell forum-detail">
    <nav className="forum-crumb"><Link href="/forum">校园论坛</Link><span>/</span><Link href={`/forum?board=${result.topic.board}`}>{boardLabel(result.topic.board)}</Link><span>/</span>主题</nav>
    {message && <p role="status" className="forum-success">{message}</p>}
    <header className="forum-detail-head"><p className="archive-label">{boardLabel(result.topic.board)} / {result.floors.length} FLOORS</p><h1>{result.topic.title}</h1><div className="forum-tags">{result.topic.tags.map((name) => <Link key={name} href={`/forum?tag=${encodeURIComponent(name)}`}>#{name}</Link>)}</div><time dateTime={result.topic.published_at ?? ""}>{result.topic.published_at ? `发布于 ${new Date(result.topic.published_at).toLocaleString("zh-CN")}` : ""}</time></header>
    <ol className="forum-timeline">{result.floors.map((floor) => <li key={floor.id}>
      <div className="forum-floor-number">#{String(floor.floor_no).padStart(2, "0")}</div>
      <article><header><Link href={`/forum/accounts/${floor.account.handle}`}>{floor.account.display_name}</Link><span>@{floor.account.handle}</span>{floor.in_world_time && <time>{floor.in_world_time}</time>}</header>{floor.replyFloor && <p className="forum-reply">回复 #{String(floor.replyFloor).padStart(2, "0")}</p>}<p className="forum-body">{floor.body}</p></article>
    </li>)}</ol>
    <div className="forum-end"><span>END OF THREAD</span><Link href="/forum">返回论坛</Link></div>
  </main><SiteFooter /></div>;
}
