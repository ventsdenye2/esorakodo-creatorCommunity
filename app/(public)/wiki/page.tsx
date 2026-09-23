import Link from "next/link";
import { SiteFooter } from "../../../src/components/layout/site-footer";
import { SiteHeader } from "../../../src/components/layout/site-header";
import { listWikiEntities } from "../../../src/features/wiki/queries";
import { getWikiEntityHref, getWikiEntityLabel, wikiEntityTypes } from "../../../src/features/wiki/types";
import { isSupabaseConfigured } from "../../../src/lib/supabase/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "校园档案" };

export default async function WikiPage() {
  const entities = await listWikiEntities();

  return (
    <div>
      <SiteHeader current="wiki" />
      <main id="main-content" className="wiki-page">
        <header className="wiki-page-header">
          <div>
            <p className="archive-label">LIVING ARCHIVE / WIKI</p>
            <h1>校园档案</h1>
            <p>人物、学院与地点共同构成可追溯的校园知识层。每次修改都会留下 Revision。</p>
          </div>
          <Link className="button button-primary" href="/create/wiki">建立档案</Link>
        </header>

        {!isSupabaseConfigured() ? (
          <div className="wiki-status" role="status">
            <strong>等待连接开发数据库</strong>
            <p>页面与写入边界已经就绪；配置 Supabase 后会显示真实档案。</p>
          </div>
        ) : null}

        {entities.length === 0 ? (
          <section className="wiki-empty">
            <span>NO ARCHIVE RECORDS</span>
            <h2>还没有校园档案。</h2>
            <p>从一个人物、学院或地点开始，创建操作会同时生成首个 Revision。</p>
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
