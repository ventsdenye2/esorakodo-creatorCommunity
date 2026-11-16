"use client";
import { useState } from "react";
import type { Collaborator } from "./collaboration-server";
import type { ForumSession } from "./use-forum-collaboration";
import { manageForum } from "./manage-client";

export function InvitationControls({ live }: { live: ForumSession }) {
  const topicId = live.envelope!.document.topic_id;
  const [mode, setMode] = useState(live.envelope!.mode), [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Collaborator[]>([]), [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState(""), [link, setLink] = useState("");
  async function run(action: () => Promise<void>) {
    if (busy) return; setBusy(true); setError(""); setNotice("");
    try { await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : "操作失败。"); } finally { setBusy(false); }
  }
  return <div className="forum-invitation-controls">
    <label>谁可以编辑<select value={mode} disabled={busy} onChange={event => { const next = event.target.value as typeof mode; void run(async () => { await manageForum(topicId, { kind: "mode", mode: next }); setMode(next); setNotice("编辑权限已更新。"); }); }}>
      <option value="owner">仅自己可编辑</option><option value="invited">受邀协作者可编辑</option><option value="everyone">所有已登录用户可编辑</option>
    </select></label>
    <p className="forum-form-hint">{mode === "owner" ? "现有协作者暂时不能编辑，邀请链接暂停加入。切回受邀模式后恢复。" : mode === "everyone" ? "所有登录用户都能改写。移除单个协作者不会阻止其编辑；需要限制时切换为受邀模式。" : "仅你和已加入的协作者可以改写。"} 权限管理与回退版本由你负责。</p>
    <label>搜索创作者<input value={query} maxLength={60} onChange={event => { setQuery(event.target.value); setSearched(false); setMatches([]); }} placeholder="输入昵称或 @账号，至少 2 个字" disabled={busy} /></label>
    <button type="button" className="button button-secondary" disabled={busy || query.trim().length < 2} onClick={() => void run(async () => { const data = await manageForum(topicId, { kind: "search", query }); setMatches(data.result); setSearched(true); })}>搜索用户</button>
    {searched && !matches.length && <p role="status">没有找到对应用户，请换一个昵称或账号。</p>}
    <ul className="forum-member-list">{matches.map(person => {
      const invited = live.envelope!.collaboratorIds.includes(person.id);
      return <li key={person.id}><span><strong>{person.display_name}</strong><small>@{person.handle}</small></span><button type="button" disabled={busy || invited || mode === "owner"} onClick={() => void run(async () => { await live.manage(person.handle); setNotice(`已邀请 ${person.display_name}，对方可从创作中心进入。`); })}>{invited ? "已加入" : "邀请"}</button></li>;
    })}</ul>
    <div className="forum-invite-link"><strong>链接邀请</strong><p className="forum-form-hint">链接 7 天内有效，对方登录后确认加入。生成新链接会使旧链接失效；撤销链接不会移除已加入的协作者。</p>
      <button type="button" className="button button-secondary" disabled={busy || mode === "owner"} onClick={() => void run(async () => { const data = await manageForum(topicId, { kind: "invite", revoke: false }); setLink(`${location.origin}/forum/invite#${data.result}`); setNotice("邀请链接已生成。请复制并分享。"); })}>生成新链接</button>
      <button type="button" disabled={busy} className="button button-secondary" onClick={() => void run(async () => { await manageForum(topicId, { kind: "invite", revoke: true }); setLink(""); setNotice("原邀请链接已撤销。"); })}>撤销链接</button>
      {link && <label>邀请地址<input readOnly value={link} onFocus={event => event.target.select()} /><button type="button" className="button button-secondary" onClick={() => void run(async () => { await navigator.clipboard.writeText(link); setNotice("邀请链接已复制。"); })}>复制链接</button></label>}
    </div>
    {notice && <p role="status">{notice}</p>}{error && <p role="alert" className="forum-error">{error}</p>}
  </div>;
}
