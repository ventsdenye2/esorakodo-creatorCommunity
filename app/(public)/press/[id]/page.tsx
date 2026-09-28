import { WorkCommunity } from "../../../../src/features/community/work-community";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { SiteHeader } from "../../../../src/components/layout/site-header";
import { SiteFooter } from "../../../../src/components/layout/site-footer";
import { getArticle } from "../../../../src/features/press/queries";
import { getAuthenticatedCreatorId } from "../../../../src/features/wiki/queries";
import { StructuredBodyRenderer } from "../../../../src/features/editor/components/StructuredBodyRenderer";
import { getEditorEntities } from "../../../../src/features/editor/queries";
import { parseBody } from "../../../../src/features/editor/types";
import "../../../../src/features/press/press.css";
import "../../../../src/features/editor/editor.css";
export const dynamic = "force-dynamic";
export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; if (!z.uuid().safeParse(id).success) notFound();
  const [article, creator, entities] = await Promise.all([getArticle(id), getAuthenticatedCreatorId(), getEditorEntities()]);
  if (!article) notFound();
  return <><SiteHeader current="press" /><main id="main-content" className="press-shell"><nav className="press-crumb"><Link href="/press">空天校刊</Link><span>/</span><span>正文</span></nav><article className="press-article"><header className="press-article-head"><div className="press-tags">{article.tags.map((tag) => <Link key={tag} href={`/press?tag=${encodeURIComponent(tag)}`}>{tag}</Link>)}</div><h1>{article.title}</h1>{article.summary && <p className="press-deck">{article.summary}</p>}<div className="press-byline"><span>文 / {article.authorName}</span><time dateTime={article.published_at ?? article.created_at}>{new Date(article.published_at ?? article.created_at).toLocaleDateString("zh-CN")}</time></div></header><StructuredBodyRenderer body={parseBody(article.body)} entities={entities} /><footer className="press-article-end"><Link href="/press">← 返回校刊</Link>{creator === article.creator_id && <Link href={`/create/article/${article.id}`}>管理文章 ↗</Link>}</footer><WorkCommunity kind="article" id={article.id} creatorId={article.creator_id} /></article></main><SiteFooter /></>;
}

