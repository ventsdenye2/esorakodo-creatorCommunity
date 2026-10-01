"use client";
import Link from "next/link";
import { GuideLink } from "../guide/guide-link";
import { startTransition, useActionState, useState } from "react";
import { BlockEditor } from "../editor/components/BlockEditor";
import { StructuredBodyRenderer } from "../editor/components/StructuredBodyRenderer";
import { emptyBody, parseBody, type EditorEntity } from "../editor/types";
import { saveArticle } from "./actions";
import type { ArticleView } from "./queries";
import { articleTags } from "./schemas";

export function ArticleEditor({ article, entities, saved = false }: { article?: ArticleView; entities: EditorEntity[]; saved?: boolean }) {
  const [title, setTitle] = useState(article?.title ?? "");
  const [summary, setSummary] = useState(article?.summary ?? "");
  const [tags, setTags] = useState<string[]>(article?.tags.filter((tag) => articleTags.some((allowed) => allowed === tag)) ?? []);
  const [body, setBody] = useState(article ? parseBody(article.body) : emptyBody);
  const [preview, setPreview] = useState(false);
  const [state, action, pending] = useActionState(saveArticle, { error: null, saved, id: article?.id ?? null, version: article?.version ?? null });
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const submitter = (event.nativeEvent as SubmitEvent).submitter; const data = submitter ? new FormData(event.currentTarget, submitter) : new FormData(event.currentTarget); startTransition(() => action(data)); }
  return <form className="content-editor" onSubmit={submit}>
    <GuideLink section="press">查看校刊写作与发布教程</GuideLink>
    <input type="hidden" name="body" value={JSON.stringify(body)} />
    {state.error && <p className="editor-error" role="alert">{state.error}</p>}{state.saved && !state.error && <p role="status" className="editor-success">文章已保存。可从创作中心继续编辑。</p>}
    <fieldset disabled={pending}><legend className="sr-only">文章内容</legend><label>标题<input name="title" required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="为文章拟一个标题" /></label><label>摘要<textarea name="summary" rows={3} maxLength={500} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="向读者简要介绍这篇文章" /></label><input type="hidden" name="tags" value={tags.join(",")} /><fieldset className="press-tag-picker"><legend>栏目标签 · 最多选择 3 项</legend>{articleTags.map((tag) => <label key={tag}><input type="checkbox" checked={tags.includes(tag)} disabled={pending || (!tags.includes(tag) && tags.length >= 3)} onChange={() => setTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag])} />{tag}</label>)}</fieldset><BlockEditor value={body} onChange={setBody} entities={entities} disabled={pending} /></fieldset>
    <div className="editor-actions"><Link href="/create/article">我的文章</Link><button type="button" aria-expanded={preview} onClick={() => setPreview(!preview)}>{preview ? "收起预览" : "阅读预览"}</button><button type="submit" name="intent" value="save" disabled={pending}>{pending ? "正在保存…" : "保存"}</button><button className="editor-publish" type="submit" name="intent" value="publish" disabled={pending}>{article?.status === "published" ? "更新已发布文章" : "发布文章"}</button></div>
    <p className="editor-hint">文章使用你的作者资料署名。保存后可在其他设备继续编辑；发布后读者即可在校刊阅读。</p>
    {preview && <section className="press-preview" aria-label="文章预览"><p className="press-kicker">阅读预览 · 尚未发布的修改</p><h1>{title || "未命名文章"}</h1><p className="press-deck">{summary}</p><StructuredBodyRenderer body={body} entities={entities} /></section>}
  </form>;
}

