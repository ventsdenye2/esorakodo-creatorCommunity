"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { ForumAccount } from "../../types/database";
import { saveForumDraft } from "./actions";
import { forumBoards } from "./schemas";

type DraftFloor = { forum_account_id: string; body: string; in_world_time: string; reply_to_floor_no: number | null };

export function DraftEditor({ topicId, title, board, tags, initialFloors, accounts }: {
  topicId: string; title: string; board: string; tags: string[];
  initialFloors: DraftFloor[]; accounts: ForumAccount[];
}) {
  const [floors, setFloors] = useState<DraftFloor[]>(initialFloors);
  const [state, action, pending] = useActionState(saveForumDraft.bind(null, topicId), { error: null, saved: false });
  function update(index: number, patch: Partial<DraftFloor>) {
    setFloors((current) => current.map((floor, position) => position === index ? { ...floor, ...patch } : floor));
  }
  function move(index: number, offset: number) {
    setFloors((current) => {
      const next = [...current];
      [next[index], next[index + offset]] = [next[index + offset], next[index]];
      return next.map((floor, position) => ({ ...floor,
        reply_to_floor_no: floor.reply_to_floor_no && floor.reply_to_floor_no < position + 1 ? floor.reply_to_floor_no : null,
      }));
    });
  }
  return <form action={action} className="forum-form forum-editor">
    <input type="hidden" name="messages" value={JSON.stringify(floors)} />
    {state.error && <p className="forum-error" role="alert">{state.error}</p>}
    {state.saved && !state.error && <p className="forum-success" role="status">草稿已保存。</p>}
    <div className="forum-editor-meta">
      <label>主题标题<input name="title" defaultValue={title} required maxLength={160} /></label>
      <label>版面<select name="board" defaultValue={board}>{forumBoards.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <label>标签<input name="tags" defaultValue={tags.join(", ")} placeholder="用逗号分隔，最多 8 个" /></label>
    </div>
    <div className="forum-editor-heading"><h2>编排楼层</h2><span>{floors.length} / 100</span></div>
    {floors.length === 0 && <p className="forum-empty-note">尚无楼层。添加至少一层后即可发布。</p>}
    <ol className="forum-editor-floors">{floors.map((floor, index) => <li key={index}>
      <div className="forum-floor-tools"><strong>#{String(index + 1).padStart(2, "0")}</strong><div>
        <button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`上移第 ${index + 1} 层`}>↑</button>
        <button type="button" disabled={index === floors.length - 1} onClick={() => move(index, 1)} aria-label={`下移第 ${index + 1} 层`}>↓</button>
        <button type="button" onClick={() => setFloors((current) => current.filter((_, position) => position !== index).map((item, position) => ({ ...item, reply_to_floor_no: item.reply_to_floor_no && item.reply_to_floor_no < position + 1 ? item.reply_to_floor_no : null })))} aria-label={`删除第 ${index + 1} 层`}>×</button>
      </div></div>
      <div className="forum-floor-fields">
        <label>发言身份<select value={floor.forum_account_id} onChange={(event) => update(index, { forum_account_id: event.target.value })} required><option value="">选择账号</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.display_name} (@{account.handle})</option>)}</select></label>
        <label>回复楼层<select value={floor.reply_to_floor_no ?? ""} onChange={(event) => update(index, { reply_to_floor_no: event.target.value ? Number(event.target.value) : null })}><option value="">独立发言</option>{floors.slice(0, index).map((_, floorIndex) => <option key={floorIndex} value={floorIndex + 1}>#{String(floorIndex + 1).padStart(2, "0")}</option>)}</select></label>
        <label>戏内时间（可选）<input value={floor.in_world_time} maxLength={100} onChange={(event) => update(index, { in_world_time: event.target.value })} /></label>
      </div>
      <label>正文<textarea value={floor.body} required rows={6} maxLength={10000} onChange={(event) => update(index, { body: event.target.value })} /></label>
    </li>)}</ol>
    <button type="button" className="button button-secondary" disabled={floors.length >= 100} onClick={() => setFloors((current) => [...current, { forum_account_id: accounts[0]?.id ?? "", body: "", in_world_time: "", reply_to_floor_no: null }])}>＋ 添加楼层</button>
    {floors.length > 0 && <details className="forum-preview"><summary>预览楼层</summary><ol>{floors.map((floor, index) => <li key={index}><span>#{String(index + 1).padStart(2, "0")}</span><div><strong>{accounts.find((account) => account.id === floor.forum_account_id)?.display_name ?? "未选择身份"}</strong>{floor.in_world_time && <small>{floor.in_world_time}</small>}{floor.reply_to_floor_no && <small>回复 #{String(floor.reply_to_floor_no).padStart(2, "0")}</small>}<p>{floor.body || "尚未填写正文。"}</p></div></li>)}</ol></details>}
    <div className="forum-form-actions"><Link className="text-link" href="/create/forum">返回草稿列表</Link><button className="button button-secondary" type="submit" name="intent" value="save" disabled={pending}>保存草稿</button><button className="button button-primary" type="submit" name="intent" value="publish" disabled={pending || floors.length === 0}>发布主题</button></div>
    <p className="forum-form-hint">发布后作品与楼层冻结，无法直接改写。</p>
  </form>;
}
