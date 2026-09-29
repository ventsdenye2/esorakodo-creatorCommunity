import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "../../../../../../src/components/layout/site-footer";
import { SiteHeader } from "../../../../../../src/components/layout/site-header";
import { RevisionBrowser } from "../../../../../../src/features/wiki/revision-browser";
import { createClient } from "../../../../../../src/lib/supabase/server";
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

  const supabase = await createClient();
  const { data: profiles } = await supabase.from("profiles").select("id,display_name,handle").in("id", [...new Set(revisions.map(item => item.editor_id))]);
  const editors = Object.fromEntries((profiles ?? []).map(item => [item.id, item.display_name || item.handle]));

  return (
    <div>
      <SiteHeader current="wiki" />
      <main id="main-content" className="wiki-form-page">
        <nav className="wiki-breadcrumb" aria-label="面包屑">
          <Link href={`/wiki/${entity.type}/${entity.slug}`}>{entity.name}</Link><span>/</span><span>修订历史</span>
        </nav>
        <header className="wiki-form-header">
          <p className="archive-label">REVISION LEDGER</p>
          <h1>修订历史</h1>
          <p>每次修改都是一次提交。选择两个版本比较差异，或从旧版本恢复为新的修订。</p>
        </header>
        {query.error ? <p className="auth-notice auth-notice-error" role="alert">{query.error}</p> : null}

        <RevisionBrowser revisions={revisions} entity={entity} canRestore={Boolean(creatorId)} editors={editors} />
      </main>
      <SiteFooter />
    </div>
  );
}
