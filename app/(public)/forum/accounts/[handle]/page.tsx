import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "../../../../../src/components/layout/site-footer";
import { SiteHeader } from "../../../../../src/components/layout/site-header";
import { getForumAccount } from "../../../../../src/features/forum-accounts/queries";
import { getWikiEntityById } from "../../../../../src/features/forum/queries";
import { getAuthenticatedCreatorId } from "../../../../../src/features/wiki/queries";
import "../../../../../src/features/forum/forum.css";

export const dynamic = "force-dynamic";
export default async function ForumAccountPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const account = await getForumAccount(handle);
  if (!account) notFound();
  const [student, creatorId] = await Promise.all([account.student_id ? getWikiEntityById(account.student_id) : null, getAuthenticatedCreatorId()]);
  return <div><SiteHeader current="forum" /><main id="main-content" className="forum-shell forum-account-page">
    <nav className="forum-crumb"><Link href="/forum">校园论坛</Link><span>/</span>论坛身份</nav>
    <p className="archive-label">FORUM ACCOUNT / {account.account_type.toUpperCase()}</p>
    <h1>{account.display_name}</h1><p className="forum-handle">@{account.handle}</p>
    {account.signature && <p className="forum-signature">{account.signature}</p>}
    {student && <p>关联校园档案：<Link href={`/wiki/student/${student.slug}`}>{student.name}</Link></p>}
    {creatorId === account.created_by && <Link className="button button-secondary" href={`/create/forum/account/${account.id}`}>编辑身份</Link>}
  </main><SiteFooter /></div>;
}
