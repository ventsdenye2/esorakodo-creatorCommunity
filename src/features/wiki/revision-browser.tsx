"use client";
/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- Scrollable diff is keyboard-accessible. */

import { useState } from "react";
import { GuideLink } from "../guide/guide-link";
import { diffLines } from "diff";
import { Markdown } from "./markdown";
import { rollbackWikiRevision } from "./actions";
import type { WikiEntityDetail, WikiRevisionView } from "./types";
import "./revision.css";

function snapshot(revision?: WikiRevisionView): Record<string, unknown> {
  const value = revision?.snapshot;
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
const fields = [["name", "档案名称"], ["summary", "摘要"], ["college_id", "所属学院"], ["signature", "人物签名"], ["body", "Markdown 正文"]];
const text = (value: unknown) => typeof value === "string" ? value : "";
function changes(before: string, after: string) {
  // Bound pathological large rewrites; whole-text removal/addition remains exact.
  return diffLines(before, after, { timeout: 100 }) ?? [
    { value: before, removed: true, added: false },
    { value: after, added: true, removed: false },
  ];
}

export function RevisionBrowser({ revisions, entity, canRestore, editors }: {
  revisions: WikiRevisionView[]; entity: WikiEntityDetail; canRestore: boolean; editors: Record<string, string>;
}) {
  const sorted = [...revisions].sort((a,b) => Number(snapshot(b).version ?? 0) - Number(snapshot(a).version ?? 0));
  const [from, setFrom] = useState(sorted[1]?.id ?? sorted[0]?.id ?? "");
  const [to, setTo] = useState(sorted[0]?.id ?? "");
  const [pending, setPending] = useState(false);
  const beforeRevision = sorted.find(item => item.id === from);
  const afterRevision = sorted.find(item => item.id === to);
  const before = snapshot(beforeRevision), after = snapshot(afterRevision);
  const changed = fields.filter(([key]) => text(before[key]) !== text(after[key]));
  function label(revision: WikiRevisionView) { return `v${String(snapshot(revision).version ?? "?")} · ${revision.summary}`; }
  if (!sorted.length) return <p>暂无修订记录。</p>;
  return <div className="revision-browser">
    <GuideLink section="history">如何比较版本和恢复旧内容？</GuideLink>
    <div className="revision-compare-controls"><label>从版本<select value={from} onChange={event => setFrom(event.target.value)}>{sorted.map(item => <option key={item.id} value={item.id}>{label(item)}</option>)}</select></label><span aria-hidden="true">→</span><label>到版本<select value={to} onChange={event => setTo(event.target.value)}>{sorted.map(item => <option key={item.id} value={item.id}>{label(item)}</option>)}</select></label></div>
    <div className="revision-workspace"><aside><h2>修订记录</h2><ol className="revision-commits">{sorted.map((revision,index) => <li key={revision.id} data-selected={to === revision.id}><button type="button" onClick={() => {setTo(revision.id); setFrom(sorted[index + 1]?.id ?? revision.id);}}><span>v{String(snapshot(revision).version)} {index === 0 && <em>当前</em>}</span><strong>{revision.summary || "未填写修改说明"}</strong><small>{editors[revision.editor_id] ?? revision.editor_id.slice(0,8)} · {new Date(revision.created_at).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</small><code>{revision.id.slice(0,8)}</code></button></li>)}</ol></aside>
      <section className="revision-inspection" aria-label="版本差异">
        <header><h2>v{String(before.version)} → v{String(after.version)}</h2><p>{changed.length} 个字段变更 · <span className="diff-legend-added">＋新增</span> / <span className="diff-legend-removed">−删除</span></p></header>
        {changed.length === 0 && <p className="revision-unchanged">这两个版本的档案内容相同。</p>}
        {changed.map(([key, label]) => <div className="revision-file" key={key}><h3>{label}</h3><div className="revision-diff" role="region" aria-label={`${label}差异`} tabIndex={0}>{changes(text(before[key]), text(after[key])).map((part,i) => <div className={part.added ? "diff-added" : part.removed ? "diff-removed" : "diff-context"} key={i}><span aria-label={part.added ? "新增" : part.removed ? "删除" : "不变"}>{part.added ? "+" : part.removed ? "−" : " "}</span><pre>{part.value}</pre></div>)}</div></div>)}
        <details className="revision-snapshot"><summary>查看 v{String(after.version)} 完整档案</summary><h2>{text(after.name)}</h2><p>{text(after.summary)}</p>{text(after.signature) && <blockquote>{text(after.signature)}</blockquote>}{text(after.college_id) && <p>所属学院：{text(after.college_id)}</p>}<Markdown>{text(after.body)}</Markdown></details>
        {canRestore && afterRevision && Number(after.version) !== entity.version && <details className="revision-restore"><summary>恢复此版本…</summary><p>将 v{String(after.version)} 的内容保存为一个新版本，现有历史会保留。</p><form action={rollbackWikiRevision} onSubmit={() => setPending(true)}>
          <input type="hidden" name="revisionId" value={afterRevision.id} /><input type="hidden" name="entityType" value={entity.type} /><input type="hidden" name="slug" value={entity.slug} /><input type="hidden" name="expectedVersion" value={entity.version} />
          <button className="button button-secondary" disabled={pending} type="submit">{pending ? "正在恢复…" : `确认恢复 v${String(after.version)}`}</button>
        </form></details>}
      </section>
    </div>
  </div>;
}
