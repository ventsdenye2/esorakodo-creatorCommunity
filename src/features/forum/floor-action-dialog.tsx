"use client";

import { useState } from "react";
import type { ForumAccount } from "../../types/database";
import { AuthorDialog } from "./author-dialog";
import type { EditableFloor } from "./draft-model";
import { FloorBodyEditor } from "./floor-body-editor";
import { ForumBody } from "./body-view";
import { SpeakerPicker } from "./speaker-picker";
import { forumMessageSchema } from "./schemas";
import type { Text } from "yjs";

export function FloorActionDialog({ floor, number, affectedReplies, topicId, accounts, locked, onBusy, onClose, onUpdate, onReply, onInsert, onRemove, onOwner, onAccount, sharedText, viewerId }: {
  floor: EditableFloor; number: number; affectedReplies: number; topicId: string; accounts: ForumAccount[]; locked: boolean;
  onBusy: (busy: boolean) => void; onClose: () => void; onUpdate: (patch: Partial<EditableFloor>) => void;
  onReply: () => void; onInsert: () => void; onRemove: () => void; onOwner: () => void; onAccount: (account: ForumAccount) => void;
  sharedText?: Text; viewerId?: string;
}) {
  const [mode, setMode] = useState("menu");
  const [localBody, setBody] = useState(floor.body);
  const body = sharedText ? floor.body : localBody;
  const [time, setTime] = useState(floor.in_world_time);
  const [count, setCount] = useState(0);
  const [error, setError] = useState("");
  const titles: Record<string, string> = { menu: `第 ${number} 楼`, edit: "编辑发言", likes: "修改点赞数", questions: "修改？数", identity: "选择角色身份", delete: "删除这条发言？" };
  return <AuthorDialog title={titles[mode]} locked={locked} onClose={onClose}>
    {mode === "menu" ? <div className="forum-message-menu">
      <button data-dialog-focus type="button" onClick={onReply}>回复<span>在末尾引用这一楼</span></button>
      <button type="button" onClick={() => setMode("edit")}>编辑</button>
      <button type="button" disabled={number === 1} onClick={() => setMode("delete")}>删除{number === 1 && <span>首楼保留</span>}</button>
      <button type="button" onClick={() => { setCount(floor.like_count); setMode("likes"); }}>修改点赞数<span>{floor.like_count}</span></button>
      <button type="button" onClick={() => { setCount(floor.question_count); setMode("questions"); }}>修改？数<span>{floor.question_count}</span></button>
      <button type="button" disabled={number === 1} onClick={onOwner}>设为楼主<span>使用楼主的昵称、头像与身份</span></button>
      <button type="button" disabled={number === 1} onClick={onInsert}>向上插入楼层{number === 1 && <span>不能插在首楼之前</span>}</button>
      <button type="button" onClick={() => setMode("identity")}>角色身份选择<span>可选，也可以修改昵称和头像</span></button>
    </div> : mode === "edit" ? <div className="forum-message-edit">
      {sharedText && <p className="forum-form-hint">文字输入会实时同步。“完成编辑”用于收起这个窗口，关闭窗口不会撤回已经同步的改写。</p>}
      <FloorBodyEditor id="edit-floor-body" body={body} disabled={locked} onBusy={onBusy} onChange={setBody} sharedText={sharedText} sharedField={floor.id} />
      <details><summary>发言时间（可选）</summary><label>戏内时间<input value={time} maxLength={100} disabled={locked} onChange={event => setTime(event.target.value)} /></label></details>
      <div className="forum-live-preview"><span>发言效果</span><ForumBody body={body} /></div>
      {error && <p role="alert" className="forum-error">{error}</p>}
      <button type="button" className="button button-primary" disabled={locked || !body.trim()} onClick={() => {
        const parsed = forumMessageSchema.safeParse({ ...floor, body, in_world_time: time, reply_to_floor_no: null });
        if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "发言内容无效。"); return; }
        onUpdate({ body: parsed.data.body, in_world_time: parsed.data.in_world_time });
      }}>完成编辑</button>
    </div> : mode === "likes" || mode === "questions" ? <div className="forum-count-editor">
      <p className="forum-form-hint">这是你为剧情设定的数量。</p>
      <label>{mode === "likes" ? "点赞数" : "？数"}<input data-dialog-focus type="number" min={0} max={999999999} step={1} value={Number.isNaN(count) ? "" : count} onChange={event => { setCount(event.target.valueAsNumber); setError(""); }} /></label>
      {error && <p role="alert" className="forum-error">{error}</p>}
      <button type="button" className="button button-primary" onClick={() => {
        if (!Number.isInteger(count) || count < 0 || count > 999999999) { setError("请填写 0–999999999 的整数。"); return; }
        onUpdate(mode === "likes" ? { like_count: count } : { question_count: count });
      }}>确定</button>
    </div> : mode === "identity" ? <SpeakerPicker topicId={topicId} accounts={accounts} selectedId={floor.forum_account_id} defaultName="校园路人" viewerId={viewerId} onBusy={onBusy} onAccount={onAccount} onChoose={id => onUpdate({ forum_account_id: id })} />
      : <div><ForumBody body={floor.body} quoted /><p>{affectedReplies ? `有 ${affectedReplies} 条回复引用这一楼。删除后，它们会保留正文并取消这条引用。` : "删除后，后续楼层会自动重新编号。"}</p><button data-dialog-focus type="button" className="button button-secondary" onClick={onClose}>保留发言</button> <button type="button" className="button forum-danger" onClick={onRemove}>确认删除</button></div>}
  </AuthorDialog>;
}
