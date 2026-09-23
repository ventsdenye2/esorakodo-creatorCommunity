import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "../../../../src/components/layout/site-header";
import { SiteFooter } from "../../../../src/components/layout/site-footer";
import { createForumAccount } from "../../../../src/features/forum-accounts/actions";
import { getAuthenticatedCreatorId } from "../../../../src/features/wiki/queries";
import { listWikiEntities } from "../../../../src/features/wiki/queries";
import { isSupabaseConfigured } from "../../../../src/lib/supabase/config";
import "../../../../src/features/forum/forum.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "建立论坛身份" };

export default async function NewForumAccountPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ error }, creatorId, entities] = await Promise.all([searchParams, getAuthenticatedCreatorId(), listWikiEntities()]);
  if (isSupabaseConfigured() && !creatorId) redirect("/login");
  return <div><SiteHeader current="forum" /><main id="main-content" className="forum-shell forum-form-page">
    <nav className="forum-crumb"><Link href="/forum">校园论坛</Link><span>/</span><Link href="/create/forum">创作主题</Link><span>/</span>建立身份</nav>
    <p className="archive-label">FORUM IDENTITY</p><h1>建立论坛身份</h1>
    <p>一个 Creator 可以管理多个戏内账号。论坛发言会显示所选身份，Creator 负责整篇作品。</p>
    {error && <p role="alert" className="forum-error">{error}</p>}
    <form action={createForumAccount} className="forum-form">
      <label>账号标识<input name="handle" required minLength={2} maxLength={32} pattern="[A-Za-z0-9_]+" autoCapitalize="none" /></label>
      <label>显示名称<input name="displayName" required maxLength={60} /></label>
      <label>身份类型<select name="accountType" defaultValue="unknown"><option value="unknown">未公开身份</option><option value="student">学生</option><option value="organization">组织</option><option value="bot">校园机器人</option></select></label>
      <label>关联人物档案<select name="studentId" defaultValue=""><option value="">不关联</option>{entities.filter((item) => item.type === "student").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><small>选择学生身份时必须关联人物档案。</small></label>
      <label>签名<input name="signature" maxLength={280} /></label>
      <div className="forum-form-actions"><Link className="button button-secondary" href="/create/forum">返回创作</Link><button className="button button-primary" disabled={!isSupabaseConfigured()} type="submit">建立身份</button></div>
    </form>
  </main><SiteFooter /></div>;
}
