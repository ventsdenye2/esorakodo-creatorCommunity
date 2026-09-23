import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "../../../../src/components/layout/site-header";
import { SiteFooter } from "../../../../src/components/layout/site-footer";
import { DraftEditor } from "../../../../src/features/forum/draft-editor";
import { getForumTopic } from "../../../../src/features/forum/queries";
import { listOwnForumAccounts } from "../../../../src/features/forum-accounts/queries";
import { getAuthenticatedCreatorId } from "../../../../src/features/wiki/queries";
import "../../../../src/features/forum/forum.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "编排论坛楼层" };
export default async function ForumDraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [creatorId, result, accounts] = await Promise.all([getAuthenticatedCreatorId(), getForumTopic(id, true), listOwnForumAccounts()]);
  if (!creatorId) redirect("/login");
  if (!result || result.topic.creator_id !== creatorId || result.topic.status !== "draft") notFound();
  return <div><SiteHeader current="forum" /><main id="main-content" className="forum-shell forum-form-page">
    <nav className="forum-crumb"><Link href="/forum">校园论坛</Link><span>/</span><Link href="/create/forum">我的草稿</Link><span>/</span>编排楼层</nav>
    <p className="archive-label">FORUM / DRAFT</p><h1>编排楼层</h1>
    <DraftEditor topicId={id} title={result.topic.title} board={result.topic.board} tags={result.topic.tags} accounts={accounts} initialFloors={result.floors.map((floor) => ({ forum_account_id: floor.forum_account_id, body: floor.body, in_world_time: floor.in_world_time ?? "", reply_to_floor_no: floor.replyFloor }))} />
  </main><SiteFooter /></div>;
}
