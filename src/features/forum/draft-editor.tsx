"use client";

import Link from "next/link";
import { startTransition, useActionState, useRef, useState } from "react";
import type { ForumAccount } from "../../types/database";
import { saveForumDraft } from "./actions";
import { forumBoards, type ForumEntityReference } from "./schemas";
import type { EditorEntity } from "../editor/types";

type DraftFloor = { forum_account_id: string; body: string; in_world_time: string; reply_to_floor_no: number | null };
type EditableFloor = Omit<DraftFloor, "reply_to_floor_no"> & { id: string; replyToId: string | null };

function prepareFloors(initialFloors: DraftFloor[]): EditableFloor[] {
  return initialFloors.map((floor, index) => ({
    id: `initial-${index}`,
    forum_account_id: floor.forum_account_id,
    body: floor.body,
    in_world_time: floor.in_world_time,
    replyToId: floor.reply_to_floor_no === null ? null : `initial-${floor.reply_to_floor_no - 1}`,
  }));
}

export function DraftEditor({ topicId, title, board, tags, initialFloors, accounts, version, initialLinks, entities }: {
  topicId: string; title: string; board: string; tags: string[]; version: number;
  initialFloors: DraftFloor[]; accounts: ForumAccount[]; initialLinks: ForumEntityReference[]; entities: EditorEntity[];
}) {
  const [floors, setFloors] = useState<EditableFloor[]>(() => prepareFloors(initialFloors));
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftBoard, setDraftBoard] = useState(board);
  const [draftTags, setDraftTags] = useState(tags.join(", "));
  const [replyNotice, setReplyNotice] = useState("");
  const entitySelect = useRef<HTMLSelectElement>(null);
  const [links, setLinks] = useState(initialLinks);
  const [entityChoice, setEntityChoice] = useState("");
  const [state, action, pending] = useActionState(saveForumDraft.bind(null, topicId), { error: null, saved: false, version });
  function update(index: number, patch: Partial<EditableFloor>) {
    setFloors((current) => current.map((floor, position) => position === index ? { ...floor, ...patch } : floor));
  }
  function move(index: number, offset: number) {
    const next = [...floors];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    let cleared = 0;
    setFloors(next.map((floor, position) => {
      const target = next.findIndex((candidate) => candidate.id === floor.replyToId);
      if (floor.replyToId && (target < 0 || target >= position)) {
        cleared++;
        return { ...floor, replyToId: null };
      }
      return floor;
    }));
    setReplyNotice(cleared ? `重排后有 ${cleared} 条回复不再指向此前楼层，已清空其回复目标。` : "");
  }
  function remove(index: number) {
    const removedId = floors[index].id;
    const detached = floors.filter((_, position) => position !== index);
    const affected = detached.filter((floor) => floor.replyToId === removedId).length;
    setFloors(detached.map((floor) => floor.replyToId === removedId ? { ...floor, replyToId: null } : floor));
    setReplyNotice(affected ? `删除楼层后有 ${affected} 条回复失去目标，已清空其回复目标。` : "");
  }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const formData = submitter ? new FormData(event.currentTarget, submitter) : new FormData(event.currentTarget);
    startTransition(() => action(formData));
  }
  return <form onSubmit={submit} className="forum-form forum-editor">
    <input type="hidden" name="links" value={JSON.stringify(links)} />
    <input type="hidden" name="messages" value={JSON.stringify(floors.map((floor) => ({
      forum_account_id: floor.forum_account_id,
      body: floor.body,
      in_world_time: floor.in_world_time,
      reply_to_floor_no: floor.replyToId ? floors.findIndex((candidate) => candidate.id === floor.replyToId) + 1 : null,
    })))} />
    {state.error && <p className="forum-error" role="alert">{state.error}</p>}
    {state.saved && !state.error && <p className="forum-success" role="status">草稿已保存。</p>}
    {replyNotice && <p className="forum-form-hint" role="status">{replyNotice}</p>}
    <div className="forum-editor-meta">
      <label>主题标题<input name="title" value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} required maxLength={160} /></label>
      <label>版面<select name="board" value={draftBoard} onChange={(event) => setDraftBoard(event.target.value)}>{forumBoards.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <label>标签<input name="tags" value={draftTags} onChange={(event) => setDraftTags(event.target.value)} placeholder="用逗号分隔，最多 8 个" /></label>
    </div>
    <section className="forum-entity-picker" aria-label="主题关联档案"><h2>关联校园档案</h2><p className="forum-form-hint">将主题与涉及的人物、学院、地点或事件关联。关联不会改写档案内容。</p><label>选择档案<select ref={entitySelect} value={entityChoice} disabled={pending || links.length >= 30} onChange={(event) => setEntityChoice(event.target.value)}><option value="">选择一个校园档案</option>{entities.filter((entity) => !links.some((link) => link.entity_id === entity.id && link.entity_type === entity.type)).map((entity) => <option key={`${entity.type}:${entity.id}`} value={`${entity.type}:${entity.id}`}>{entity.label} · {entity.type === "student" ? "人物" : entity.type === "college" ? "学院" : entity.type === "place" ? "地点" : "事件"}</option>)}</select></label><button className="button button-secondary" type="button" disabled={pending || !entityChoice || links.length >= 30} onClick={() => { const entity = entities.find((item) => `${item.type}:${item.id}` === entityChoice); if (entity) { setLinks((current) => [...current, {entity_type:entity.type,entity_id:entity.id}]); setEntityChoice(""); } }}>添加关联</button><ul>{links.map((link) => { const entity = entities.find((item) => item.id === link.entity_id && item.type === link.entity_type); return <li key={`${link.entity_type}:${link.entity_id}`}><span>{entity?.label ?? "档案已不可用"}</span> <button className="button button-secondary" type="button" disabled={pending} onClick={() => { setLinks((current) => current.filter((item) => item !== link)); requestAnimationFrame(() => entitySelect.current?.focus()); }} aria-label={`移除${entity?.label ?? "不可用档案"}关联`}>移除</button></li>; })}</ul></section>
    <div className="forum-editor-heading"><h2>编排楼层</h2><span>{floors.length} / 100</span></div>
    {floors.length === 0 && <p className="forum-empty-note">尚无楼层。添加至少一层后即可发布。</p>}
    <ol className="forum-editor-floors">{floors.map((floor, index) => <li key={floor.id}>
      <div className="forum-floor-tools"><strong>#{String(index + 1).padStart(2, "0")}</strong><div>
        <button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`上移第 ${index + 1} 层`}>↑</button>
        <button type="button" disabled={index === floors.length - 1} onClick={() => move(index, 1)} aria-label={`下移第 ${index + 1} 层`}>↓</button>
        <button type="button" onClick={() => remove(index)} aria-label={`删除第 ${index + 1} 层`}>×</button>
      </div></div>
      <div className="forum-floor-fields">
        <label>发言身份<select value={floor.forum_account_id} onChange={(event) => update(index, { forum_account_id: event.target.value })} required><option value="">选择账号</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.display_name} (@{account.handle})</option>)}</select></label>
        <label>回复楼层<select value={floor.replyToId ?? ""} onChange={(event) => update(index, { replyToId: event.target.value || null })}><option value="">独立发言</option>{floors.slice(0, index).map((target, floorIndex) => <option key={target.id} value={target.id}>#{String(floorIndex + 1).padStart(2, "0")}</option>)}</select></label>
        <label>戏内时间（可选）<input value={floor.in_world_time} maxLength={100} onChange={(event) => update(index, { in_world_time: event.target.value })} /></label>
      </div>
      <label>正文<textarea value={floor.body} required rows={6} maxLength={10000} onChange={(event) => update(index, { body: event.target.value })} /></label>
    </li>)}</ol>
    <button type="button" className="button button-secondary" disabled={floors.length >= 100} onClick={() => setFloors((current) => [...current, { id: crypto.randomUUID(), forum_account_id: accounts[0]?.id ?? "", body: "", in_world_time: "", replyToId: null }])}>＋ 添加楼层</button>
    {floors.length > 0 && <details className="forum-preview"><summary>预览楼层</summary><ol>{floors.map((floor, index) => <li key={floor.id}><span>#{String(index + 1).padStart(2, "0")}</span><div><strong>{accounts.find((account) => account.id === floor.forum_account_id)?.display_name ?? "未选择身份"}</strong>{floor.in_world_time && <small>{floor.in_world_time}</small>}{floor.replyToId && <small>回复 #{String(floors.findIndex((candidate) => candidate.id === floor.replyToId) + 1).padStart(2, "0")}</small>}<p>{floor.body || "尚未填写正文。"}</p></div></li>)}</ol></details>}
    <div className="forum-form-actions"><Link className="text-link" href="/create/forum">返回草稿列表</Link><button className="button button-secondary" type="submit" name="intent" value="save" disabled={pending}>保存草稿</button><button className="button button-primary" type="submit" name="intent" value="publish" disabled={pending || floors.length === 0}>发布主题</button></div>
    <p className="forum-form-hint">发布后作品与楼层冻结，无法直接改写。</p>
  </form>;
}
