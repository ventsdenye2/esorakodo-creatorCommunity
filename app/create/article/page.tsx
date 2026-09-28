import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "../../../src/components/layout/site-header";
import { SiteFooter } from "../../../src/components/layout/site-footer";
import { getAuthenticatedCreatorId } from "../../../src/features/wiki/queries";
import { listOwnArticles } from "../../../src/features/press/queries";
import { getEditorEntities } from "../../../src/features/editor/queries";
import { ArticleEditor } from "../../../src/features/press/article-editor";
import { isSupabaseConfigured } from "../../../src/lib/supabase/config";
import "../../../src/features/press/press.css";
import "../../../src/features/editor/editor.css";
export const dynamic = "force-dynamic";
export const metadata = { title: "校刊投稿" };
export default async function CreateArticlePage() {
  const creator = await getAuthenticatedCreatorId();
  if (isSupabaseConfigured() && !creator) redirect("/login?next=/create/article");
  const [articles, entities] = await Promise.all([listOwnArticles(), getEditorEntities()]);
  return <><SiteHeader current="press" /><main id="main-content" className="press-shell"><nav className="press-crumb"><Link href="/creator">创作中心</Link><span>/</span><Link href="/press">校刊</Link></nav><p className="press-kicker">AUTHOR / PUBLICATIONS</p><h1 className="press-editor-title">校刊投稿</h1>{creator ? <><ArticleEditor entities={entities} /><section><h2>我的文章</h2>{articles.length ? <ul className="press-work-list">{articles.map((article) => <li key={article.id}>{article.status === "hidden" ? <strong>{article.title}（已隐藏）</strong> : <Link href={`/create/article/${article.id}`}>{article.title}</Link>}<span>{article.status === "published" ? "已发布" : article.status === "hidden" ? "已隐藏" : "草稿"} · {new Date(article.updated_at).toLocaleDateString("zh-CN")}</span></li>)}</ul> : <p className="editor-hint">保存第一篇文章后，可在这里继续编辑。</p>}</section></> : <p className="press-status">投稿服务尚未配置，请稍后再来。</p>}</main><SiteFooter /></>;
}
