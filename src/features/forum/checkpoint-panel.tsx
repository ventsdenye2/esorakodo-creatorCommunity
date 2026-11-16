"use client";
import { useState } from "react";
import type { ForumSession } from "./use-forum-collaboration";
import { AuthorDialog } from "./author-dialog";
import { manageForum } from "./manage-client";

type Checkpoint = { id: string; parent_id: string | null; label: string; created_at: string; document_revision: number };
export function CheckpointPanel({ live }: { live: ForumSession }) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [items, setItems] = useState<Checkpoint[]>([]), [head, setHead] = useState<string | null>(null), [label, setLabel] = useState(""), [selected, setSelected] = useState<Checkpoint | null>(null);
  const data = live.envelope!; const owner = data.ownerId === data.viewerId;
  async function refresh() { const result = await manageForum(data.document.topic_id); setItems(result.checkpoints); setHead(result.headId); }
  async function run(action: () => Promise<void>) {
    if (busy) return; setBusy(true); setError(""); setNotice("");
    try { await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : "版本操作失败。"); } finally { setBusy(false); }
  }
  function branch(parent: string | null, depth = 0): React.ReactNode {
    return <ul className="forum-version-branch">{items.filter(item => item.parent_id === parent).map(item => <li key={item.id}>
      <button type="button" aria-pressed={selected?.id === item.id} onClick={() => setSelected(item)} disabled={busy}><strong>{item.label}{head === item.id ? " · 当前分支" : ""}</strong><small>{new Date(item.created_at).toLocaleString("zh-CN")}</small></button>
      {depth < 24 ? branch(item.id, depth + 1) : <ul>{items.filter(child => child.parent_id === item.id).map(child => <li key={child.id}><button type="button" onClick={() => setSelected(child)}>{child.label}</button>{branch(child.id, 0)}</li>)}</ul>}
    </li>)}</ul>;
  }
  return <>
    <button type="button" className="forum-manage-collaborators" onClick={() => { setOpen(true); void run(refresh); }}>存档与版本树</button>
    {open && <AuthorDialog title="存档与版本树" locked={busy} onClose={() => { setOpen(false); setSelected(null); }}>
      <p className="forum-form-hint">自动同步保留当前改写；点击存档才新增版本。回退不会删除后续分支，并会自动备份回退前内容。</p>
      <label>存档名称<input data-dialog-focus value={label} maxLength={100} disabled={busy} placeholder="例如：第一幕完成" onChange={event => setLabel(event.target.value)} /></label>
      <button type="button" className="button button-primary" disabled={busy || !label.trim() || live.revoked || live.needsRefresh} onClick={() => void run(async () => {
        if (!await live.flush()) throw new Error("当前改写尚未同步完成，请先保存后重试。");
        await manageForum(data.document.topic_id, { kind: "checkpoint", label, revision: live.getRevision() }); setLabel(""); await refresh(); setNotice("新版本已存档。");
      })}>存档当前状态</button>
      {busy && <p role="status">正在处理，请稍候…</p>}
      {!items.length && !busy && !error && <p>还没有存档，可以先保存第一个版本。</p>}
      {branch(null)}
      {selected && <section className="forum-restore-confirm"><h3>{selected.label}</h3><p>回退后，当前帖子将恢复到这个版本。其他正在编辑的页面需要刷新后继续。</p>
        {owner ? <button type="button" className="button button-secondary" disabled={busy || live.revoked || live.needsRefresh} onClick={() => void run(async () => {
          if (!await live.flush()) throw new Error("当前改写尚未同步完成，请先保存后重试。");
          await manageForum(data.document.topic_id, { kind: "restore", checkpointId: selected.id, revision: live.getRevision() }); location.reload();
        })}>确认回退到此版本</button> : <p>只有原作者可以回退版本。</p>}
      </section>}
      {notice && <p role="status">{notice}</p>}{error && <p role="alert" className="forum-error">{error}</p>}
    </AuthorDialog>}
  </>;
}
