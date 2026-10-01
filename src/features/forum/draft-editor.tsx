"use client";

import { MarkdownImport } from "../import/markdown-import";
import { prepareForumImportAccounts } from "../import/actions";
import Link from "next/link";
import { GuideLink } from "../guide/guide-link";
import { ThreadTree } from "./thread-tree";
import { startTransition, useActionState, useRef, useState } from "react";
import type { ForumAccount } from "../../types/database";
import { saveForumDraft } from "./actions";
import { forumBoards, type ForumEntityReference } from "./schemas";
import type { EditorEntity } from "../editor/types";

type DraftFloor = { like_count: number; question_count: number; forum_account_id: string; body: string; in_world_time: string; reply_to_floor_no: number | null };
type EditableFloor = Omit<DraftFloor, "reply_to_floor_no"> & { id: string; replyToId: string | null };

function prepareFloors(initialFloors: DraftFloor[]): EditableFloor[] {
  return initialFloors.map((floor, index) => ({
    id: `initial-${index}`,
    like_count: floor.like_count ?? 0, question_count: floor.question_count ?? 0,
    forum_account_id: floor.forum_account_id,
    body: floor.body,
    in_world_time: floor.in_world_time,
    replyToId: floor.reply_to_floor_no === null ? null : `initial-${floor.reply_to_floor_no - 1}`,
  }));
}

export function DraftEditor({ topicId, title, board, tags, initialFloors, accounts: initialAccounts, version, initialLinks, entities }: {
  topicId: string; title: string; board: string; tags: string[]; version: number;
  initialFloors: DraftFloor[]; accounts: ForumAccount[]; initialLinks: ForumEntityReference[]; entities: EditorEntity[];
}) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [importing, setImporting] = useState(false);
  const [floors, setFloors] = useState<EditableFloor[]>(() => prepareFloors(initialFloors));
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftBoard, setDraftBoard] = useState(board);
  const [draftTags, setDraftTags] = useState(tags.join(", "));
  const [preview, setPreview] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [replyNotice, setReplyNotice] = useState("");
  const entitySelect = useRef<HTMLSelectElement>(null);
  const [links, setLinks] = useState(initialLinks);
  const [entityChoice, setEntityChoice] = useState("");
  const [state, action, saving] = useActionState(saveForumDraft.bind(null, topicId), { error: null, saved: false, version });
  const pending = saving || importing;
  function update(index: number, patch: Partial<EditableFloor>) {
    setDirty(true);
    setFloors((current) => current.map((floor, position) => position === index ? { ...floor, ...patch } : floor));
  }
  function add(replyToId: string | null = null) {
    if (floors.length >= 100 || pending) return;
    const id = crypto.randomUUID();
    setDirty(true); setPreview(false);
    setFloors(current => [...current, { id, forum_account_id: accounts[0]?.id ?? "", body: "", in_world_time: "", replyToId, like_count: 0, question_count: 0 }]);
    requestAnimationFrame(() => document.getElementById('body-' + id)?.focus());
  }
  function remove(index: number) {
    setDirty(true);
    const removedId = floors[index].id;
    const detached = floors.filter((_, position) => position !== index);
    const affected = detached.filter((floor) => floor.replyToId === removedId).length;
    setFloors(detached.map((floor) => floor.replyToId === removedId ? { ...floor, replyToId: null } : floor));
    requestAnimationFrame(() => document.getElementById('add-forum-floor')?.focus());
    setReplyNotice(affected ? `删除楼层后有 ${affected} 条回复失去目标，已清空其回复目标。` : "");
  }
  function move(index: number, offset: number) {
    const next = [...floors];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    let cleared = 0;
    setDirty(true);
    setFloors(next.map((floor, position) => {
      const target = next.findIndex(candidate => candidate.id === floor.replyToId);
      if (floor.replyToId && target >= position) { cleared++; return { ...floor, replyToId: null }; }
      return floor;
    }));
    setReplyNotice(cleared ? `重排后有 ${cleared} 条回复不再指向此前楼层，已改为独立发言。` : "");
  }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const formData = submitter ? new FormData(event.currentTarget, submitter) : new FormData(event.currentTarget);
    setDirty(false);
    startTransition(() => action(formData));
  }
  return <form onSubmit={submit} className="forum-form forum-editor" onChange={() => setDirty(true)}>
    <MarkdownImport kind="forum" disabled={pending} onImport={async (data, raw) => {
      setImporting(true);
      try {
        const result = await prepareForumImportAccounts(raw);
        if (result.error) throw new Error(result.error);
        const ids = data.floors.map(() => crypto.randomUUID());
        const imported = data.floors.map((floor, index) => {
          const account = result.accounts.find(a => a.handle === floor.handle);
          if (!account) throw new Error("论坛身份匹配失败，请重新导入。");
          return { id: ids[index], forum_account_id: account.id, body: floor.body, in_world_time: floor.in_world_time, like_count: floor.like_count, question_count: floor.question_count, replyToId: floor.reply_to_floor_no ? ids[floor.reply_to_floor_no - 1] : null };
        });
        setAccounts(result.accounts); setFloors(imported); setDraftTitle(data.title); setDraftBoard(data.board); setDraftTags(data.tags.join(", ")); setDirty(true); setPreview(false); setReplyNotice("");
      } finally { setImporting(false); }
    }} />
    <GuideLink section="forum">楼层、回复与发布怎么用？查看教程</GuideLink>
    <fieldset className="forum-editor-lock" disabled={pending}>
    <input type="hidden" name="links" value={JSON.stringify(links)} />
    <input type="hidden" name="messages" value={JSON.stringify(floors.map((floor) => ({
      like_count: floor.like_count, question_count: floor.question_count,
      forum_account_id: floor.forum_account_id,
      body: floor.body,
      in_world_time: floor.in_world_time,
      reply_to_floor_no: floor.replyToId ? floors.findIndex((candidate) => candidate.id === floor.replyToId) + 1 : null,
    })))} />
    {state.error && <p className="forum-error" role="alert">{state.error}</p>}
    {state.saved && !dirty && !state.error && <p className="forum-success" role="status">草稿已保存。</p>}
    {replyNotice && <p className="forum-form-hint" role="status">{replyNotice}</p>}
    <div className="forum-editor-meta">
      <label>主题标题<input name="title" value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} required maxLength={160} /></label>
      <label>版面<select name="board" value={draftBoard} onChange={(event) => setDraftBoard(event.target.value)}>{forumBoards.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <label>标签<input name="tags" value={draftTags} onChange={(event) => setDraftTags(event.target.value)} placeholder="用逗号分隔，最多 8 个" /></label>
    </div>
    <details className="forum-entity-picker"><summary>关联校园档案（{links.length}）</summary><p className="forum-form-hint">将主题与涉及的人物、学院、地点或事件关联。关联不会改写档案内容。</p><label>选择档案<select ref={entitySelect} value={entityChoice} disabled={pending || links.length >= 30} onChange={(event) => setEntityChoice(event.target.value)}><option value="">选择一个校园档案</option>{entities.filter((entity) => !links.some((link) => link.entity_id === entity.id && link.entity_type === entity.type)).map((entity) => <option key={`${entity.type}:${entity.id}`} value={`${entity.type}:${entity.id}`}>{entity.label} · {entity.type === "student" ? "人物" : entity.type === "college" ? "学院" : entity.type === "place" ? "地点" : "事件"}</option>)}</select></label><button className="button button-secondary" type="button" disabled={pending || !entityChoice || links.length >= 30} onClick={() => { const entity = entities.find((item) => `${item.type}:${item.id}` === entityChoice); if (entity) { setLinks((current) => [...current, {entity_type:entity.type,entity_id:entity.id}]); setEntityChoice(""); } }}>添加关联</button><ul>{links.map((link) => { const entity = entities.find((item) => item.id === link.entity_id && item.type === link.entity_type); return <li key={`${link.entity_type}:${link.entity_id}`}><span>{entity?.label ?? "档案已不可用"}</span> <button className="button button-secondary" type="button" disabled={pending} onClick={() => { setLinks((current) => current.filter((item) => item !== link)); requestAnimationFrame(() => entitySelect.current?.focus()); }} aria-label={`移除${entity?.label ?? "不可用档案"}关联`}>移除</button></li>; })}</ul></details>
    <div className="forum-editor-heading"><div><h2>{draftTitle || "未命名主题"}</h2><p className="forum-form-hint">{floors.length} / 100 条发言 · 回复会显示在对应分支下</p></div><button className="button button-secondary" type="button" aria-pressed={preview} onClick={() => setPreview(!preview)}>{preview ? "继续编辑" : "阅读预览"}</button></div>
    <p className="forum-form-hint">👍 赞同 · ？疑惑：以下数量由你编写，用于剧情展示。</p>
    {floors.length === 0 && <p className="forum-empty-note">尚无发言。添加一条发言，开始编排这场讨论。</p>}
    <ThreadTree prefix="draft" nodes={floors.map((floor, index) => {
      const account = accounts.find(item => item.id === floor.forum_account_id);
      return { id: floor.id, parentId: floor.replyToId, floor: index + 1, body: floor.body || "尚未填写正文。", time: floor.in_world_time, name: account?.display_name ?? "未选择身份", handle: account?.handle ?? "", avatarId: account?.avatar_asset_id, likes: floor.like_count, questions: floor.question_count };
    })} onReply={preview ? undefined : add} renderEditor={preview ? undefined : (node) => {
      const index = floors.findIndex(item => item.id === node.id);
      const floor = floors[index];
      return <div className="thread-inline-editor">
        <div className="thread-order"><span>发言顺序 #{index + 1}</span><button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`上移第 ${index + 1} 层`}>↑</button><button type="button" disabled={index === floors.length - 1} onClick={() => move(index, 1)} aria-label={`下移第 ${index + 1} 层`}>↓</button></div>
        <div className="forum-floor-fields">
          <label>发言身份<select value={floor.forum_account_id} onChange={event => update(index, { forum_account_id: event.target.value })} required><option value="">选择账号</option>{accounts.map(account => <option key={account.id} value={account.id}>{account.display_name} (@{account.handle})</option>)}</select></label>
          <label>回复对象<select value={floor.replyToId ?? ""} onChange={event => update(index, { replyToId: event.target.value || null })}><option value="">独立发言</option>{floors.slice(0, index).map((target, i) => <option key={target.id} value={target.id}>#{i + 1} · {target.body.slice(0, 24) || "空白发言"}</option>)}</select></label>
          <label>戏内时间<input value={floor.in_world_time} maxLength={100} onChange={event => update(index, { in_world_time: event.target.value })} placeholder="可选" /></label>
        </div>
        <label htmlFor={'body-' + floor.id} className="sr-only">第 {index + 1} 层正文</label><textarea id={'body-' + floor.id} value={floor.body} required rows={3} maxLength={10000} onChange={event => update(index, { body: event.target.value })} placeholder="以这个身份写下发言……" />
        <div className="thread-edit-reactions"><label>👍 赞同<input type="number" min={0} max={999999999} step={1} required value={floor.like_count} onChange={event => update(index, { like_count: event.target.valueAsNumber || 0 })} /></label><label>？疑惑<input type="number" min={0} max={999999999} step={1} required value={floor.question_count} onChange={event => update(index, { question_count: event.target.valueAsNumber || 0 })} /></label><button className="thread-delete" type="button" onClick={() => remove(index)} aria-label={`删除第 ${index + 1} 层`}>删除发言</button></div>
      </div>;
    }} />
    <button id="add-forum-floor" type="button" className="button button-secondary" disabled={floors.length >= 100} onClick={() => add()}>＋ 添加独立发言</button>
    <div className="forum-form-actions"><Link className="text-link" href="/create/forum">返回草稿列表</Link><button className="button button-secondary" type="submit" name="intent" value="save" disabled={pending}>保存草稿</button><button className="button button-primary" type="submit" name="intent" value="publish" disabled={pending || floors.length === 0}>发布主题</button></div>
    <p className="forum-form-hint">发布后作品与楼层冻结，无法直接改写。</p>
  </fieldset></form>;
}
