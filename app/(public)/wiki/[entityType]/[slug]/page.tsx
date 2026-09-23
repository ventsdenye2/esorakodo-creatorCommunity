import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "../../../../../src/components/layout/site-footer";
import { SiteHeader } from "../../../../../src/components/layout/site-header";
import { listPublishedTopicsForStudent } from "../../../../../src/features/forum/queries";
import { getWikiEntityBySlug, listColleges } from "../../../../../src/features/wiki/queries";
import { getWikiEntityLabel, isWikiEntityType } from "../../../../../src/features/wiki/types";
import "../../../../../src/features/forum/forum.css";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ entityType: string; slug: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function WikiDetailPage({ params, searchParams }: PageProps) {
  const { entityType, slug } = await params;
  if (!isWikiEntityType(entityType)) notFound();
  const [entity, colleges, query] = await Promise.all([
    getWikiEntityBySlug(entityType, slug),
    listColleges(),
    searchParams,
  ]);
  if (!entity) notFound();
  const college = colleges.find((item) => item.id === entity.collegeId);
  const forumTopics = entity.type === "student" ? await listPublishedTopicsForStudent(entity.id) : [];

  return (
    <div>
      <SiteHeader current="wiki" />
      <main id="main-content" className="wiki-record-page">
        <nav className="wiki-breadcrumb" aria-label="面包屑">
          <Link href="/wiki">校园档案</Link><span>/</span><span>{getWikiEntityLabel(entity.type)}</span>
        </nav>
        {query.error ? <p className="auth-notice auth-notice-error" role="alert">{query.error}</p> : null}
        {query.message ? <p className="auth-notice auth-notice-message" role="status">{query.message}</p> : null}

        <header className="wiki-record-header">
          <div>
            <p className="archive-label">{entity.type.toUpperCase()} / {entity.id}</p>
            <h1>{entity.name}</h1>
            {entity.signature ? <blockquote>{entity.signature}</blockquote> : null}
          </div>
          <div className="wiki-record-actions">
            <span>VERSION {String(entity.version).padStart(3, "0")}</span>
            <Link className="button button-secondary" href={`/wiki/${entity.type}/${entity.slug}/history`}>Revision 历史</Link>
            <Link className="button button-primary" href={`/wiki/${entity.type}/${entity.slug}/edit`}>编辑档案</Link>
          </div>
        </header>

        <div className="wiki-record-layout">
          <article>
            <h2>档案摘要</h2>
            <p>{entity.summary ?? "这份档案还没有摘要。"}</p>
          </article>
          <aside>
            <dl>
              <div><dt>类型</dt><dd>{getWikiEntityLabel(entity.type)}</dd></div>
              <div><dt>稳定地址</dt><dd>{entity.slug}</dd></div>
              {college ? <div><dt>所属学院</dt><dd>{college.name}</dd></div> : null}
              <div><dt>创建时间</dt><dd>{new Date(entity.createdAt).toLocaleDateString("zh-CN")}</dd></div>
              <div><dt>最近更新</dt><dd>{new Date(entity.updatedAt).toLocaleDateString("zh-CN")}</dd></div>
            </dl>
          </aside>
        </div>
        {forumTopics.length > 0 ? <section className="forum-wiki-traces" aria-labelledby="forum-traces-title">
          <div><p className="archive-label">CAMPUS / FORUM</p><h2 id="forum-traces-title">论坛里的相关讨论</h2></div>
          <ul>{forumTopics.map((topic) => <li key={topic.id}><Link href={`/forum/${topic.id}`}>{topic.title}</Link><time dateTime={topic.published_at ?? ""}>{topic.published_at ? new Date(topic.published_at).toLocaleDateString("zh-CN") : ""}</time></li>)}</ul>
        </section> : null}
      </main>
      <SiteFooter />
    </div>
  );
}
