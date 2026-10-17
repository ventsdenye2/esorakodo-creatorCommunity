"use client";
import { useState } from "react";
import { Avatar } from "../../components/ui/avatar";
import { AuthorDialog } from "./author-dialog";
import type { ForumSession } from "./use-forum-collaboration";

export function CollaborationPanel({ live }: { live: ForumSession }) {
  const [open, setOpen] = useState(false), [handle, setHandle] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const data = live.envelope;
  if (!data) return null;
  const owner = data.ownerId === data.viewerId;
  const activeIds = [...new Set(data.presence.map(presence => presence.creator_id))];
  const online = data.members.filter(member => activeIds.includes(member.id));
  const collaborators = data.members.filter(member => member.id !== data.ownerId && member.id !== data.viewerId || member.id === data.viewerId && !owner);
  async function manage(removeId?: string) {
    if (busy) return; setBusy(true); setError("");
    try { await live.manage(removeId ? undefined : handle, removeId); setHandle(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "设置未保存，请重试。"); }
    finally { setBusy(false); }
  }
  return <>
    <section className="forum-collaboration" aria-label="共同写作">
      <div className="forum-collaboration-people"><span className="forum-online-avatars">{online.slice(0, 4).map(member => <Avatar key={member.id} assetId={member.avatar_asset_id} name={member.display_name} />)}</span><span><strong>{collaborators.length ? "共同写作" : "我的帖子"}</strong><small>{live.connected ? `${online.length || 1} 人在线` : "正在连接…"}</small></span></div>
      <p className="forum-sync-state" role="status" data-state={live.revoked || live.error ? "error" : live.dirty ? "syncing" : live.connected ? "synced" : "connecting"}><i aria-hidden="true" />{live.revoked ? "编辑权限已失效" : live.error ? "同步未完成" : live.dirty ? "正在同步改写…" : live.connected ? "改写已同步" : "正在重新连接…"}</p>
      {owner && <button type="button" className="forum-manage-collaborators" aria-haspopup="dialog" onClick={() => setOpen(true)}>管理协作者{collaborators.length ? ` · ${collaborators.length}` : ""}</button>}
    </section>
    {data.status === "published" && <p className="forum-live-publication"><strong>已发布 · 修改将实时公开</strong><span>正文尚未完整时，读者暂时看到最近一次有效内容。</span><a href={`/forum/${data.document.topic_id}`} target="_blank" rel="noreferrer">查看公开帖子 ↗</a></p>}
    {online.filter(member => member.id !== data.viewerId).map(member => {
      const place = data.presence.find(presence => presence.creator_id === member.id)?.field;
      const index = live.value?.floors.findIndex(floor => floor.id === place);
      return <p className="forum-collaborator-location" key={member.id}>{member.display_name}{place ? ` 正在编辑${index !== undefined && index >= 0 ? `第 ${index + 1} 楼` : place}` : " 正在查看帖子"}</p>;
    })}
    {data.document.publish_error && <p className="forum-error" role="status">{data.document.publish_error === "FORUM_CONTENT_INCOMPLETE" ? "当前改写尚未完整，已保留在共同编辑中。补全内容后会自动继续公开同步。" : "部分改写暂未公开，请检查空白正文、身份或图片是否可用。共同编辑内容已保留。"}</p>}
    {live.error && <div className="forum-collaboration-error" role="alert"><p>{live.error}</p><button type="button" className="button button-secondary" onClick={live.reconnect}>重新连接</button><button type="button" className="button button-secondary" onClick={live.download}>下载当前改写</button></div>}
    {open && <AuthorDialog title="一起写这个帖子" locked={busy} onClose={() => setOpen(false)}>
      <p className="forum-form-hint">邀请后，对方可以在自己的创作中心进入，共同修改这个帖子。发布和成员管理仍由你负责。</p>
      <label>创作者 @账号<input data-dialog-focus value={handle} maxLength={60} placeholder="例如：night_study" disabled={busy} onChange={event => setHandle(event.target.value)} /></label>
      <button type="button" className="button button-primary" disabled={busy || !handle.trim()} onClick={() => void manage()}>添加协作者</button>
      {error && <p role="alert" className="forum-error">{error}</p>}
      <ul className="forum-member-list">{data.members.filter(member => member.id === data.ownerId || collaborators.some(person => person.id === member.id)).map(member => <li key={member.id}><Avatar assetId={member.avatar_asset_id} name={member.display_name} /><span><strong>{member.display_name}</strong><small>@{member.handle} · {member.id === data.ownerId ? "作者" : "协作者"}</small></span>{member.id !== data.ownerId && <button type="button" disabled={busy} onClick={() => void manage(member.id)}>移除</button>}</li>)}</ul>
      <p className="forum-form-hint">移除后立即停止对方的同步读写，已经写入的内容仍留在作品中。</p>
    </AuthorDialog>}
  </>;
}
