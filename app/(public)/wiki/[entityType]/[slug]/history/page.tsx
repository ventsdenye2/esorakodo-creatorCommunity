import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "../../../../../../src/components/layout/site-footer";
import { SiteHeader } from "../../../../../../src/components/layout/site-header";
import { rollbackWikiRevision } from "../../../../../../src/features/wiki/actions";
import { getAuthenticatedCreatorId, getWikiEntityBySlug, getWikiRevisions } from "../../../../../../src/features/wiki/queries";
import { isWikiEntityType } from "../../../../../../src/features/wiki/types";

export const dynamic = "force-dynamic";
type PageProps = {
  params: Promise<{ entityType: string; slug: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function WikiHistoryPage({ params, searchParams }: PageProps) {
  const { entityType, slug } = await params;
  if (!isWikiEntityType(entityType)) notFound();
  const entity = await getWikiEntityBySlug(entityType, slug);
  if (!entity) notFound();
  const [revisions, creatorId, query] = await Promise.all([
    getWikiRevisions(entityType, entity.id),
    getAuthenticatedCreatorId(),
    searchParams,
  ]);

  return (
    <div>
      <SiteHeader current="wiki" />
      <main id="main-content" className="wiki-form-page">
        <nav className="wiki-breadcrumb" aria-label="面包屑">
          <Link href={`/wiki/${entity.type}/${entity.slug}`}>{entity.name}</Link><span>/</span><span>Revision 历史</span>
        </nav>
        <header className="wiki-form-header">
          <p className="archive-label">REVISION LEDGER</p>
          <h1>Revision 历史</h1>
          <p>历史记录不可删除。回滚会以旧快照为内容创建一个新的 Revision。</p>
        </header>
        {query.error ? <p className="auth-notice auth-notice-error" role="alert">{query.error}</p> : null}

        {revisions.length === 0 ? (
          <div className="wiki-status"><strong>暂无 Revision</strong><p>实体初始化后应至少存在一条创建记录。</p></div>
        ) : (
          <ol className="revision-list">
            {revisions.map((revision, index) => (
              <li key={revision.id}>
                <div>
                  <span>REV {String(revisions.length - index).padStart(3, "0")}</span>
                  <time dateTime={revision.created_at}>{new Date(revision.created_at).toLocaleString("zh-CN")}</time>
                </div>
                <h2>{revision.summary || "未填写修改说明"}</h2>
                <p>Editor: {revision.editor_id.slice(0, 8)} · Snapshot v{String((revision.snapshot as { version?: number }).version ?? "—")}</p>
                {creatorId && index > 0 ? (
                  <form action={rollbackWikiRevision}>
                    <input name="revisionId" type="hidden" value={revision.id} />
                    <input name="entityType" type="hidden" value={entity.type} />
                    <input name="slug" type="hidden" value={entity.slug} />
                    <input name="expectedVersion" type="hidden" value={entity.version} />
                    <button className="button button-secondary" type="submit">回滚到此版本</button>
                  </form>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
