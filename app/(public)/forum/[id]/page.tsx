import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../../../src/components/layout/site-header";
import { SiteFooter } from "../../../../src/components/layout/site-footer";
import { getForumTopic } from "../../../../src/features/forum/queries";
import { boardLabel } from "../../../../src/features/forum/schemas";
import { WorkCommunity } from "../../../../src/features/community/work-community";
import { ThreadTree } from "../../../../src/features/forum/thread-tree";
import { getEditorEntities } from "../../../../src/features/editor/queries";
import "../../../../src/features/forum/forum.css";

export const dynamic = "force-dynamic";
export default async function ForumTopicPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ message?: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [{ message }, result] = await Promise.all([searchParams, getForumTopic(id)]);
  if (!result) notFound();
  const entities=result.links.length?await getEditorEntities():[];
  const linkedEntities=entities.filter(entity=>result.links.some(link=>link.entity_id===entity.id&&link.entity_type===entity.type));
  return <div><SiteHeader current="forum" /><main id="main-content" className="forum-shell forum-detail">
    <nav className="forum-crumb"><Link href="/forum">校园论坛</Link><span>/</span><Link href={`/forum?board=${result.topic.board}`}>{boardLabel(result.topic.board)}</Link><span>/</span>主题</nav>
    {message && <p role="status" className="forum-success">{message}</p>}
    <header className="forum-detail-head"><p className="archive-label">{boardLabel(result.topic.board)} / {result.floors.length} FLOORS</p><h1>{result.topic.title}</h1><div className="forum-tags">{result.topic.tags.map((name) => <Link key={name} href={`/forum?tag=${encodeURIComponent(name)}`}>#{name}</Link>)}</div><time dateTime={result.topic.published_at ?? ""}>{result.topic.published_at ? `发布于 ${new Date(result.topic.published_at).toLocaleString("zh-CN")}` : ""}</time></header>
    <p className="thread-reading-note">按回复关系阅读 · 楼层编号保留发言顺序 · 👍 / ？为剧情中的反应</p>
    <ThreadTree nodes={result.floors.map(floor => ({ id: floor.id, parentId: floor.reply_to_message_id, floor: floor.floor_no, body: floor.body, time: floor.in_world_time ?? "", name: floor.account.display_name, handle: floor.account.handle, avatarId: floor.account.avatar_asset_id, likes: floor.like_count, questions: floor.question_count }))} />
    <div className="forum-end"><span>END OF THREAD</span><Link href="/forum">返回论坛</Link></div>
    {linkedEntities.length>0&&<section className="forum-preview"><h2>相关校园档案</h2><div className="forum-tags">{linkedEntities.map(entity=><Link key={`${entity.type}:${entity.id}`} href={entity.href}>{entity.label} ↗</Link>)}</div></section>}
    <WorkCommunity kind="forum" id={id} creatorId={result.topic.creator_id} />
  </main><SiteFooter /></div>;
}
