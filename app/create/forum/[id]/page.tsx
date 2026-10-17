import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "../../../../src/components/layout/site-header";
import { SiteFooter } from "../../../../src/components/layout/site-footer";
import { CollaborativeForumEditor } from "../../../../src/features/forum/collaborative-editor";
import { createClient } from "../../../../src/lib/supabase/server";
import { getForumTopic } from "../../../../src/features/forum/queries";
import { listOwnForumAccounts } from "../../../../src/features/forum-accounts/queries";
import { getAuthenticatedCreatorId } from "../../../../src/features/wiki/queries";
import { getEditorEntities } from "../../../../src/features/editor/queries";
import "../../../../src/features/forum/forum.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "写论坛帖子" };
export default async function ForumDraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [creatorId, result, accounts, entities] = await Promise.all([getAuthenticatedCreatorId(), getForumTopic(id, true), listOwnForumAccounts(), getEditorEntities()]);
  if (!creatorId) redirect("/login");
  const db = await createClient();
  const permission = await db.rpc("can_edit_forum", { p_topic_id: id });
  if (!result || !permission.data || !["draft", "published"].includes(result.topic.status)) notFound();
  return <div><SiteHeader current="forum" /><main id="main-content" className="forum-shell forum-form-page">
    <nav className="forum-crumb"><Link href="/forum">校园论坛</Link><span>/</span><Link href="/create/forum">我的帖子与协作</Link><span>/</span>写帖子</nav>
    <h1 className="sr-only">写论坛帖子</h1>
    <CollaborativeForumEditor topicId={id} version={result.topic.version} initialLinks={result.links} entities={entities} title={result.topic.title} board={result.topic.board} tags={result.topic.tags} accounts={accounts} initialFloors={result.floors.map((floor) => ({ like_count: floor.like_count, question_count: floor.question_count, forum_account_id: floor.forum_account_id, body: floor.body, in_world_time: floor.in_world_time ?? "", reply_to_floor_no: floor.replyFloor }))} />
  </main><SiteFooter /></div>;
}
