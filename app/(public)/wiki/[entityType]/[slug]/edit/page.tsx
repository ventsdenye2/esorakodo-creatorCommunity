import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteFooter } from "../../../../../../src/components/layout/site-footer";
import { SiteHeader } from "../../../../../../src/components/layout/site-header";
import { updateWikiEntity } from "../../../../../../src/features/wiki/actions";
import { getAuthenticatedCreatorId, getWikiEntityBySlug, listColleges } from "../../../../../../src/features/wiki/queries";
import { getWikiEntityLabel, isWikiEntityType } from "../../../../../../src/features/wiki/types";

export const dynamic = "force-dynamic";
type PageProps = {
  params: Promise<{ entityType: string; slug: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditWikiPage({ params, searchParams }: PageProps) {
  const { entityType, slug } = await params;
  if (!isWikiEntityType(entityType)) notFound();
  const [entity, colleges, creatorId, query] = await Promise.all([
    getWikiEntityBySlug(entityType, slug),
    listColleges(),
    getAuthenticatedCreatorId(),
    searchParams,
  ]);
  if (!entity) notFound();
  if (!creatorId) redirect(`/login?error=${encodeURIComponent("请先登录后再编辑校园档案。")}`);

  return (
    <div>
      <SiteHeader current="wiki" />
      <main id="main-content" className="wiki-form-page">
        <nav className="wiki-breadcrumb" aria-label="面包屑">
          <Link href={`/wiki/${entity.type}/${entity.slug}`}>{entity.name}</Link><span>/</span><span>编辑</span>
        </nav>
        <header className="wiki-form-header">
          <p className="archive-label">EDIT {getWikiEntityLabel(entity.type).toUpperCase()} / VERSION {entity.version}</p>
          <h1>编辑档案</h1>
          <p>保存时会检查当前版本；如果已有更新，不会静默覆盖他人的内容。</p>
        </header>
        {query.error ? <p className="auth-notice auth-notice-error" role="alert">{query.error}</p> : null}
        <form action={updateWikiEntity} className="wiki-form">
          <input name="entityType" type="hidden" value={entity.type} />
          <input name="entityId" type="hidden" value={entity.id} />
          <input name="slug" type="hidden" value={entity.slug} />
          <input name="expectedVersion" type="hidden" value={entity.version} />
          <label><span>档案名称</span><input defaultValue={entity.name} maxLength={100} name="name" required /></label>
          {entity.type !== "college" ? (
            <label>
              <span>所属学院</span>
              <select defaultValue={entity.collegeId ?? ""} name="collegeId">
                <option value="">不关联学院</option>
                {colleges.map((college) => <option key={college.id} value={college.id}>{college.name}</option>)}
              </select>
            </label>
          ) : <input name="collegeId" type="hidden" value="" />}
          {entity.type === "student" ? (
            <label><span>人物签名</span><input defaultValue={entity.signature ?? ""} maxLength={280} name="signature" /></label>
          ) : <input name="signature" type="hidden" value="" />}
          <label><span>档案摘要</span><textarea defaultValue={entity.summary ?? ""} maxLength={4000} name="summary" rows={8} /></label>
          <label><span>本次修改说明</span><input maxLength={280} name="editSummary" required /></label>
          <div className="wiki-form-actions">
            <Link className="button button-secondary" href={`/wiki/${entity.type}/${entity.slug}`}>取消</Link>
            <button className="button button-primary" type="submit">保存 Revision</button>
          </div>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
