import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "../../../../../src/components/layout/site-header";
import { SiteFooter } from "../../../../../src/components/layout/site-footer";
import { updateForumAccount } from "../../../../../src/features/forum-accounts/actions";
import { listOwnForumAccounts } from "../../../../../src/features/forum-accounts/queries";
import { getAuthenticatedCreatorId, listWikiEntities } from "../../../../../src/features/wiki/queries";
import "../../../../../src/features/forum/forum.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "编辑论坛身份" };
export default async function EditForumAccountPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ id }, { error }, creatorId, accounts, entities] = await Promise.all([params, searchParams, getAuthenticatedCreatorId(), listOwnForumAccounts(), listWikiEntities()]);
  if (!creatorId) redirect("/login");
  const account = accounts.find((item) => item.id === id);
  if (!account) notFound();
  return <div><SiteHeader current="forum" /><main id="main-content" className="forum-shell forum-form-page">
    <nav className="forum-crumb"><Link href="/forum">校园论坛</Link><span>/</span><Link href={`/forum/accounts/${account.handle}`}>@{account.handle}</Link><span>/</span>编辑</nav>
    <p className="archive-label">FORUM IDENTITY / EDIT</p><h1>编辑论坛身份</h1>
    {error && <p role="alert" className="forum-error">{error}</p>}
    <form action={updateForumAccount} className="forum-form"><input type="hidden" name="id" value={account.id} />
      <label>账号标识<input name="handle" defaultValue={account.handle} required minLength={2} maxLength={32} pattern="[A-Za-z0-9_]+" autoCapitalize="none" /></label>
      <label>显示名称<input name="displayName" defaultValue={account.display_name} required maxLength={60} /></label>
      <label>身份类型<select name="accountType" defaultValue={account.account_type}><option value="unknown">未公开身份</option><option value="student">学生</option><option value="organization">组织</option><option value="bot">校园机器人</option></select></label>
      <label>关联人物档案<select name="studentId" defaultValue={account.student_id ?? ""}><option value="">不关联</option>{entities.filter((item) => item.type === "student").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>签名<input name="signature" defaultValue={account.signature ?? ""} maxLength={280} /></label>
      <div className="forum-form-actions"><Link className="button button-secondary" href={`/forum/accounts/${account.handle}`}>取消</Link><button className="button button-primary" type="submit">保存身份</button></div>
    </form>
  </main><SiteFooter /></div>;
}
