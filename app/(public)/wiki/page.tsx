import Link from "next/link";
import { SiteFooter } from "../../../src/components/layout/site-footer";
import { SiteHeader } from "../../../src/components/layout/site-header";
import { listWikiEntities } from "../../../src/features/wiki/queries";
import { getWikiEntityHref, getWikiEntityLabel, wikiEntityTypes } from "../../../src/features/wiki/types";
import { isSupabaseConfigured } from "../../../src/lib/supabase/config";
import "../../../src/features/creator/portal.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "校园档案" };

export default async function WikiPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const query = await searchParams;
  const q = (query.q ?? "").trim().slice(0, 80);
  const selectedType = wikiEntityTypes.find(type => type === query.type) ?? "";
  const allEntities = await listWikiEntities();
  const entities = allEntities.filter(entity => (!selectedType || entity.type === selectedType) && (!q || entity.name.toLocaleLowerCase().includes(q.toLocaleLowerCase())));

  return (
    <div>
      <SiteHeader current="wiki" />
      <main id="main-content" className="wiki-page">
        <header className="wiki-page-header">
          <div>
            <p className="archive-label">LIVING ARCHIVE / WIKI</p>
            <h1>校园档案</h1>
            <p>查阅空天大学的人物、学院与地点资料，了解校园的过去与现在。</p>
          </div>
          <Link className="button button-primary" href="/create/wiki">建立档案</Link>
        </header>
        <form className="campus-search" action="/wiki"><label>档案名称<input name="q" defaultValue={q} maxLength={80} placeholder="查找人物、学院或地点" /></label><label>档案类型<select name="type" defaultValue={selectedType}><option value="">全部类型</option>{wikiEntityTypes.map(type => <option value={type} key={type}>{getWikiEntityLabel(type)}</option>)}</select></label><button className="button button-primary">查找档案</button></form>

        {!isSupabaseConfigured() ? (
          <div className="wiki-status" role="status">
            <strong>档案服务暂未开放</strong>
            <p>资料将在开放后陆续收录。</p>
          </div>
        ) : null}

        {entities.length === 0 ? (
          <section className="wiki-empty">
            <span>NO ARCHIVE RECORDS</span>
            <h2>{q || selectedType ? "没有找到符合条件的档案。" : "还没有校园档案。"}</h2>
            <p>{q || selectedType ? "尝试其他关键词，或切换档案类型。" : "人物、学院与地点资料将在此陆续收录。"}</p>
          </section>
        ) : (
          <div className="wiki-groups">
            {wikiEntityTypes.map((type) => {
              const items = entities.filter((entity) => entity.type === type);
              return (
                <section className="wiki-group" key={type}>
                  <div className="wiki-group-heading">
                    <h2>{getWikiEntityLabel(type)}</h2>
                    <span>{String(items.length).padStart(2, "0")} RECORDS</span>
                  </div>
                  {items.length === 0 ? (
                    <p className="wiki-group-empty">此类别暂无档案。</p>
                  ) : (
                    <ul className="wiki-index">
                      {items.map((entity) => (
                        <li key={entity.id}>
                          <Link href={getWikiEntityHref(type, entity.slug)}>
                            <strong>{entity.name}</strong>
                            <span>{entity.summary ?? "尚未填写摘要。"}</span>
                            <small>v{entity.version} · {entity.slug}</small>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
