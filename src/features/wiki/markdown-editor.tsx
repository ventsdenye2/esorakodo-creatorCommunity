"use client";

import { useId, useRef, useState } from "react";
import { Markdown } from "./markdown";

const formats = [
  { label: "标题", before: "\n## ", after: "\n", sample: "小节标题" },
  { label: "粗体", before: "**", after: "**", sample: "重点内容" },
  { label: "斜体", before: "*", after: "*", sample: "强调内容" },
  { label: "有序列表", before: "\n1. ", after: "\n2. 下一项\n", sample: "第一项" },
  { label: "无序列表", before: "\n- ", after: "\n- 下一项\n", sample: "第一项" },
  { label: "引用", before: "\n> ", after: "\n", sample: "引用内容" },
  { label: "链接", before: "[", after: "](https://example.com)", sample: "链接文字" },
  { label: "代码", before: "\n```\n", after: "\n```\n", sample: "代码内容" },
  { label: "表格", before: "\n", after: "\n", sample: "| 项目 | 说明 |\n| --- | --- |\n| 内容 | 内容 |\n| 内容 | 内容 |" },
];

export function MarkdownEditor({ initialValue = "" }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  const [mode, setMode] = useState("split");
  const ref = useRef<HTMLTextAreaElement>(null);
  const id = useId();
  function insert(format: typeof formats[number]) {
    const input = ref.current;
    const start = input?.selectionStart ?? value.length;
    const end = input?.selectionEnd ?? start;
    const content = value.slice(start, end) || format.sample;
    const next = value.slice(0, start) + format.before + content + format.after + value.slice(end);
    if (next.length > 50000) return;
    setValue(next);
    if (mode === "preview") setMode("edit");
    requestAnimationFrame(() => { ref.current?.focus(); ref.current?.setSelectionRange(start + format.before.length, start + format.before.length + content.length); });
  }
  return <section className="markdown-editor" aria-label="档案正文编辑器">
    <div className="markdown-editor-heading"><label htmlFor={id}>档案正文</label><div className="markdown-modes" aria-label="编辑视图">{[["edit", "编辑"], ["split", "分栏"], ["preview", "预览"]].map(([key, label]) => <button key={key} type="button" aria-pressed={mode === key} onClick={() => setMode(key)}>{label}</button>)}</div></div>
    <div className="markdown-toolbar" aria-label="插入格式">{formats.map(format => <button key={format.label} type="button" onClick={() => insert(format)}>{format.label}</button>)}</div>
    <div className={`markdown-panes markdown-mode-${mode}`}>
      <textarea id={id} ref={ref} aria-label="Markdown 正文" name="body" value={value} onChange={event => setValue(event.target.value)} maxLength={50000} rows={18} placeholder="在这里写下档案。选中文字后，可用上方按钮添加格式。" hidden={mode === "preview"} />
      {mode !== "edit" && <div className="markdown-live-preview" aria-label="正文预览">{value ? <Markdown>{value}</Markdown> : <p className="markdown-placeholder">正文预览会显示在这里。</p>}</div>}
    </div>
    <p className="markdown-help">支持 Markdown 标题、表格、列表、粗体、斜体与引用。{value.length.toLocaleString("zh-CN")} / 50,000 字</p>
  </section>;
}
