import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { SiteHeader } from "../../../../src/components/layout/site-header";
import { SiteFooter } from "../../../../src/components/layout/site-footer";
import { getAuthenticatedCreatorId } from "../../../../src/features/wiki/queries";
import { getArticle } from "../../../../src/features/press/queries";
import { getEditorEntities } from "../../../../src/features/editor/queries";
import { ArticleEditor } from "../../../../src/features/press/article-editor";
import "../../../../src/features/press/press.css";
import "../../../../src/features/editor/editor.css";
export const dynamic = "force-dynamic";
export default async function EditArticlePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const [{ id }, { saved }, creator] = await Promise.all([params, searchParams, getAuthenticatedCreatorId()]);
  if (!z.uuid().safeParse(id).success) notFound();
  if (!creator) redirect(`/login?next=${encodeURIComponent(`/create/article/${id}`)}`);
  const [article, entities] = await Promise.all([getArticle(id, true), getEditorEntities()]);
  if (!article) return <><SiteHeader current="press" /><main id="main-content" className="press-shell"><h1 className="press-editor-title">无法编辑此文章</h1><p className="press-status">文章不存在、已隐藏，或不属于当前作者。</p><Link href="/create/article">返回我的文章</Link></main><SiteFooter /></>;
  return <><SiteHeader current="press" /><main id="main-content" className="press-shell"><nav className="press-crumb"><Link href="/create/article">我的文章</Link><span>/</span><span>编辑文章</span></nav><p className="press-kicker">AUTHOR / PUBLICATIONS</p><h1 className="press-editor-title">{article.status === "published" ? "修订文章" : "继续写作"}</h1><ArticleEditor article={article} entities={entities} saved={saved === "1"} /></main><SiteFooter /></>;
}
