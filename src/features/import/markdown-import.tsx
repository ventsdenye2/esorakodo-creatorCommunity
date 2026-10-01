"use client";
import { useRef, useState } from "react";
import { MAX_IMPORT_BYTES, parsers, type ImportKind } from "./parse";
import "./markdown-import.css";

export function MarkdownImport<K extends ImportKind>({ kind, disabled, onImport }: { kind: K; disabled?: boolean; onImport: (data: ReturnType<(typeof parsers)[K]>, raw: string) => void | Promise<void> }) {
  const [raw, setRaw] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const readVersion = useRef(0);
  async function read(file?: File) {
    const version = ++readVersion.current;
    setRaw(""); setConfirmed(false); setError(""); setNotice("");
    if (!file) return;
    setBusy(true);
    try {
      if (file.size > MAX_IMPORT_BYTES) throw new Error("文件最多 512 KiB。");
      const text = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer());
      if (version === readVersion.current) setRaw(text);
    } catch (e) { if (version === readVersion.current) setError(e instanceof Error ? e.message : "文件读取失败，请使用 UTF-8 编码。"); }
    finally { if (version === readVersion.current) setBusy(false); }
  }
  async function apply() {
    setBusy(true); setError(""); setNotice("");
    try {
      const data = parsers[kind](raw) as ReturnType<(typeof parsers)[K]>;
      await onImport(data, raw);
      setNotice(`“${data.title}”已填入编辑器，尚未保存。请预览后保存或发布。`);
      setConfirmed(false);
    } catch (e) { setError(e instanceof Error ? e.message : "导入失败，请重试。"); }
    finally { setBusy(false); }
  }
  return <details className="markdown-import"><summary>从 Markdown 导入</summary><fieldset disabled={disabled || busy}>
    <legend className="sr-only">Markdown 导入</legend>
    <p>选择 UTF-8 的 .md 文件（最多 512 KiB），或粘贴全文。<a href={`/guide/templates/${kind}.md`} download>下载模板</a> · <a href="/guide#import" target="_blank" rel="noreferrer">格式说明与 AI 提示词 ↗</a></p>
    {kind === "forum" && <p>按 @账号复用你已有的身份；缺少的身份将自动创建，不关联人物。其他作者占用的账号不能导入。已有昵称保持不变。</p>}
    <label>选择 Markdown 文件<input type="file" accept=".md,.markdown,text/markdown,text/plain" onChange={e => { const file = e.target.files?.[0]; e.target.value = ""; void read(file); }} /></label>
    <label>或粘贴 Markdown<textarea rows={8} value={raw} onChange={e => { readVersion.current++; setRaw(e.target.value); setConfirmed(false); setError(""); setNotice(""); }} /></label>
    <label className="markdown-import-confirm"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} /><span>我确认替换当前标题与正文等内容，保留已选关联档案{kind === "forum" ? "，并创建缺少的论坛身份" : ""}。</span></label>
    <button type="button" disabled={!raw.trim() || !confirmed} onClick={() => void apply()}>{busy ? "正在导入…" : "导入并填入编辑器"}</button>
  </fieldset>{error && <p role="alert" className="editor-error">{error} 当前编辑内容未被替换。</p>}<p role="status">{notice}</p></details>;
}
