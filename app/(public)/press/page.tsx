import Link from "next/link";
import { SiteHeader } from "../../../src/components/layout/site-header";
import { SiteFooter } from "../../../src/components/layout/site-footer";
import { listArticles, listArticleTags, type ArticleView } from "../../../src/features/press/queries";
import "../../../src/features/press/press.css";
export const dynamic = "force-dynamic";
export const metadata = { title: "校刊" };
export default async function PressPage({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const { tag } = await searchParams;
  let articles: ArticleView[] = []; let tags: string[] = []; let failed = false;
  try { [articles, tags] = await Promise.all([listArticles(tag?.slice(0, 30)), listArticleTags()]); } catch { failed = true; }
  const [featured, ...rest] = articles;
  return <><SiteHeader current="press" /><main id="main-content" className="press-shell"><header className="press-masthead"><div><p className="press-kicker">KONGTIAN UNIVERSITY / PUBLICATIONS</p><h1>空天校刊</h1><p>在校园内外，观察、思考与表达。<br />阅读来自空天的文字、人物与日常。</p></div><Link href="/create/article">作者投稿 ↗</Link></header>
    <nav className="press-filter" aria-label="校刊标签"><Link href="/press" aria-current={!tag ? "page" : undefined}>全部文章</Link>{tags.map((item) => <Link key={item} href={`/press?tag=${encodeURIComponent(item)}`} aria-current={item === tag ? "page" : undefined}>{item}</Link>)}{tag && !tags.includes(tag) && <Link href={`/press?tag=${encodeURIComponent(tag)}`} aria-current="page">{tag}</Link>}</nav>
    {failed ? <section className="press-status" role="alert"><h2>校刊暂时无法载入</h2><p>请稍后刷新页面重试。</p><Link href="/press">重新载入</Link></section> : featured ? <><article className="press-feature"><div className="press-feature-label">本期新作</div><div><div className="press-tags">{featured.tags.map((item) => <span key={item}>{item}</span>)}</div><h2><Link href={`/press/${featured.id}`}>{featured.title}</Link></h2>{featured.summary && <p>{featured.summary}</p>}<div className="press-byline"><span>文 / {featured.authorName}</span><time dateTime={featured.published_at ?? featured.created_at}>{new Date(featured.published_at ?? featured.created_at).toLocaleDateString("zh-CN")}</time><Link href={`/press/${featured.id}`}>阅读全文 ↗</Link></div></div></article><ul className="press-list">{rest.map((article) => <li key={article.id}><div className="press-tags">{article.tags.map((item) => <span key={item}>{item}</span>)}</div><h2><Link href={`/press/${article.id}`}>{article.title}</Link></h2>{article.summary && <p>{article.summary}</p>}<div className="press-byline"><span>文 / {article.authorName}</span><time dateTime={article.published_at ?? article.created_at}>{new Date(article.published_at ?? article.created_at).toLocaleDateString("zh-CN")}</time></div></li>)}</ul></> : <section className="press-empty"><p className="press-kicker">PUBLICATIONS</p><h2>{tag ? "该栏目暂无文章" : "新一期校刊，敬请期待"}</h2><p>{tag ? "可切换其他标签或查看全部文章。" : "正式刊发的文章将在这里与读者见面。"}</p>{tag && <Link href="/press">查看全部文章 ↗</Link>}</section>}
  </main><SiteFooter /></>;
}
