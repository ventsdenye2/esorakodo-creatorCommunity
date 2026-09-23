import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter } from "../../../src/components/layout/site-footer";
import { SiteHeader } from "../../../src/components/layout/site-header";
import { createWikiEntity } from "../../../src/features/wiki/actions";
import { getAuthenticatedCreatorId, listColleges } from "../../../src/features/wiki/queries";
import { isSupabaseConfigured } from "../../../src/lib/supabase/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "建立校园档案" };
type PageProps = { searchParams: Promise<{ error?: string }> };

export default async function CreateWikiPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const configured = isSupabaseConfigured();
  const [creatorId, colleges] = await Promise.all([getAuthenticatedCreatorId(), listColleges()]);
  if (configured && !creatorId) redirect(`/login?error=${encodeURIComponent("请先登录后再建立校园档案。")}`);

  return (
    <div>
      <SiteHeader current="wiki" />
      <main id="main-content" className="wiki-form-page">
        <nav className="wiki-breadcrumb" aria-label="面包屑"><Link href="/wiki">校园档案</Link><span>/</span><span>建立档案</span></nav>
        <header className="wiki-form-header">
          <p className="archive-label">NEW ARCHIVE RECORD</p>
          <h1>建立校园档案</h1>
          <p>选择一种稳定实体类型。创建成功时，数据库会在同一事务写入首个 Revision。</p>
        </header>
        {!configured ? (
          <p className="auth-notice auth-notice-error" role="alert">Supabase 尚未配置，表单可预览但无法提交。</p>
        ) : null}
        {query.error ? <p className="auth-notice auth-notice-error" role="alert">{query.error}</p> : null}
        <form action={createWikiEntity} className="wiki-form">
          <label>
            <span>档案类型</span>
            <select defaultValue="student" name="entityType">
              <option value="student">人物 / Student</option>
              <option value="college">学院 / College</option>
              <option value="place">地点 / Place</option>
            </select>
            <small>学院类型会忽略所属学院和人物签名；地点类型会忽略人物签名。</small>
          </label>
          <label><span>档案名称</span><input maxLength={100} name="name" required /></label>
          <label>
            <span>稳定 Slug</span>
            <input autoCapitalize="none" maxLength={64} name="slug" pattern="[a-z0-9-]{2,64}" required />
            <small>创建后不可修改，只使用小写字母、数字和连字符。</small>
          </label>
          <label>
            <span>所属学院（可选）</span>
            <select name="collegeId">
              <option value="">不关联学院</option>
              {colleges.map((college) => <option key={college.id} value={college.id}>{college.name}</option>)}
            </select>
          </label>
          <label><span>人物签名（仅人物）</span><input maxLength={280} name="signature" /></label>
          <label><span>档案摘要</span><textarea maxLength={4000} name="summary" rows={8} /></label>
          <div className="wiki-form-actions">
            <Link className="button button-secondary" href="/wiki">取消</Link>
            <button className="button button-primary" disabled={!configured} type="submit">创建并记录 Revision</button>
          </div>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
