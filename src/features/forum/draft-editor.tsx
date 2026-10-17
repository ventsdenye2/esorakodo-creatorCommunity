"use client";

import Link from "next/link";
import { startTransition, useActionState, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { ForumAccount } from "../../types/database";
import type { EditorEntity } from "../editor/types";
import { MarkdownImport } from "../import/markdown-import";
import { prepareForumImportAccounts } from "../import/actions";
import { GuideLink } from "../guide/guide-link";
import { Avatar } from "../../components/ui/avatar";
import { saveForumDraft } from "./actions";
import { saveDraftSpeaker } from "./speaker-actions";
import { forumBoards, forumMessageSchema, type ForumEntityReference } from "./schemas";
import { defaultSpeakerName, insertFloor, prepareFloors, removeFloor, serializeFloors, type DraftFloor, type EditableFloor } from "./draft-model";
import { ThreadTree } from "./thread-tree";
import { FloorBodyEditor } from "./floor-body-editor";
import { ForumBody } from "./body-view";
import { FloorActionDialog } from "./floor-action-dialog";
import { AuthorDialog } from "./author-dialog";
import { SpeakerPicker } from "./speaker-picker";
import { CollaborationPanel } from "./collaboration-panel";
import { floorText, replaceText, writeFloors } from "./collaboration-document";
import { useSharedInput } from "./use-shared-input";
import type { ForumSession } from "./use-forum-collaboration";

type Composer = { body: string; time: string; accountId: string | null; replyToId: string | null; beforeId?: string; seed: string };
const emptyComposer = (seed: string): Composer => ({ body: "", time: "", accountId: null, replyToId: null, seed });

export function DraftEditor({ topicId, title, board, tags, initialFloors, accounts: initialAccounts, version, initialLinks, entities, live }: {
  topicId: string; title: string; board: string; tags: string[]; version: number;
  live?: ForumSession; initialFloors: DraftFloor[]; accounts: ForumAccount[]; initialLinks: ForumEntityReference[]; entities: EditorEntity[];
}) {
  const [localAccounts, setLocalAccounts] = useState(initialAccounts);
  const [localFloors, setLocalFloors] = useState<EditableFloor[]>(() => prepareFloors(initialFloors));
  const [localTitle, setLocalTitle] = useState(title);
  const [localBoard, setLocalBoard] = useState(board);
  const [localTags, setLocalTags] = useState(tags.join(", "));
  const [localLinks, setLocalLinks] = useState(initialLinks);
  const [entityChoice, setEntityChoice] = useState("");
  const [composer, setComposer] = useState(() => emptyComposer(topicId + "-" + initialFloors.length));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pickingSpeaker, setPickingSpeaker] = useState(false);
  const [localDirty, setDirty] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const operationLock = useRef(false);
  const uploadLock = useRef(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [state, action, saving] = useActionState(saveForumDraft.bind(null, topicId), { error: null, saved: false, version });
  const accounts = live?.envelope?.accounts ?? localAccounts;
  const floors = live?.value?.floors ?? localFloors;
  const draftTitle = live?.value?.title ?? localTitle;
  const draftBoard = live?.value?.board ?? localBoard;
  const draftTags = live?.value?.tags ?? localTags;
  const links = live?.value?.links ?? localLinks;
  const dirty = live ? live.dirty : localDirty;
  const setAccounts: Dispatch<SetStateAction<ForumAccount[]>> = live ? live.accounts : setLocalAccounts;
  const setFloors: Dispatch<SetStateAction<EditableFloor[]>> = next => {
    if (live) { const before = live.value?.floors ?? []; writeFloors(live.doc, typeof next === "function" ? next(before) : next); }
    else setLocalFloors(next);
  };
  const setDraftTitle = (value: string) => live ? live.doc.transact(() => replaceText(live.doc.getText("title"), value)) : setLocalTitle(value);
  const setDraftTags = (value: string) => live ? live.doc.transact(() => replaceText(live.doc.getText("tags"), value)) : setLocalTags(value);
  const setDraftBoard = (value: string) => live ? live.doc.getMap("meta").set("board", value) : setLocalBoard(value);
  const setLinks: Dispatch<SetStateAction<ForumEntityReference[]>> = next => {
    if (!live) { setLocalLinks(next); return; }
    const values = typeof next === "function" ? next(links) : next;
    const map = live.doc.getMap<ForumEntityReference>("links"), wanted = new Set(values.map(link => link.entity_type + ":" + link.entity_id));
    live.doc.transact(() => { for (const key of map.keys()) if (!wanted.has(key)) map.delete(key); for (const link of values) map.set(link.entity_type + ":" + link.entity_id, link); });
  };
  const titleRef = useRef<HTMLInputElement>(null), tagsRef = useRef<HTMLInputElement>(null);
  const titleBinding = useSharedInput(titleRef, live?.doc.getText("title"));
  const tagsBinding = useSharedInput(tagsRef, live?.doc.getText("tags"));
  const pending = saving || working || uploading || Boolean(live?.revoked);

  const selected = floors.find(floor => floor.id === selectedId);
  const speaker = accounts.find(account => account.id === composer.accountId);
  const defaultName = defaultSpeakerName(composer.seed);
  const target = floors.find(floor => floor.id === (composer.beforeId ?? composer.replyToId));
  const targetNumber = target ? floors.indexOf(target) + 1 : 0;

  function busy(value: boolean) { uploadLock.current = value; setUploading(value); }
  function rememberAccount(account: ForumAccount) { setAccounts(current => [...current.filter(item => item.id !== account.id), account]); }
  function focusComposer() { requestAnimationFrame(() => bodyRef.current?.querySelector("textarea")?.focus()); }
  function context(replyToId: string | null, beforeId?: string) {
    if (pending) return;
    setComposer(current => ({ ...current, replyToId, beforeId }));
    setSelectedId(null); setError(""); focusComposer();
  }
  function patchFloor(id: string, patch: Partial<EditableFloor>) {
    setFloors(current => current.map(floor => floor.id === id ? { ...floor, ...patch } : floor));
    setDirty(true); setSelectedId(null);
  }
  async function send() {
    if (pending || operationLock.current || uploadLock.current) return;
    const body = composer.body.trim();
    if (!body) { setError("先写下这条发言。"); focusComposer(); return; }
    if (floors.length >= 100) { setError("一篇帖子最多 100 条发言。"); return; }
    if (composer.beforeId && floors.findIndex(floor => floor.id === composer.beforeId) <= 0) { setError("不能在首楼之前插入发言。"); return; }
    const validation = forumMessageSchema.safeParse({ body, in_world_time: composer.time, forum_account_id: "00000000-0000-4000-8000-000000000001", reply_to_floor_no: null });
    if (!validation.success) { setError(validation.error.issues[0]?.message ?? "发言内容无效。"); return; }
    operationLock.current = true; setWorking(true); setError("");
    try {
      let account = speaker;
      if (!account) {
        const result = await saveDraftSpeaker({ topicId, id: null, name: defaultName, avatarId: null });
        if (result.error || !result.account) { setError(result.error ?? "无法建立发言身份，请重试。"); return; }
        account = result.account; rememberAccount(account);
        // Reuse a successfully created identity even if a later local step fails.
        setComposer(current => ({ ...current, accountId: account!.id }));
      }
      const id = crypto.randomUUID();
      const floor: EditableFloor = { id, forum_account_id: account.id, body, in_world_time: composer.time, replyToId: composer.replyToId, like_count: 0, question_count: 0 };
      setFloors(current => insertFloor(current, floor, composer.beforeId));
      setComposer(emptyComposer(crypto.randomUUID())); setDirty(true);
      setNotice(live ? "发言已加入帖子，正在同步。" : "发言已加入帖子，记得保存草稿。"); focusComposer();
    } catch { setError("发言未完成，请重试。当前输入仍保留。"); }
    finally { operationLock.current = false; setWorking(false); }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    if (!(submitter instanceof HTMLButtonElement) || submitter.name !== "intent" || pending || selectedId || pickingSpeaker || operationLock.current || uploadLock.current) return;
    if (composer.body.trim()) { setError("输入框里还有未发出的内容，请先发出这条消息，或清空后再保存、发布。"); focusComposer(); return; }
    if (live) {
      operationLock.current = true; setWorking(true);
      try { const published = submitter.value === "publish"; if (await live.flush(published)) { setNotice("改写已同步。"); if (published) window.location.assign("/forum/" + topicId); } }
      finally { operationLock.current = false; setWorking(false); }
      return;
    }
    const formData = new FormData(event.currentTarget, submitter);
    setError(""); setNotice(""); setDirty(false);
    startTransition(() => action(formData));
  }
  return <form onSubmit={submit} noValidate data-live={live ? "true" : undefined} className="forum-form forum-editor forum-natural-editor" onChange={() => setDirty(true)}>
    <input type="hidden" name="title" value={draftTitle} /><input type="hidden" name="board" value={draftBoard} /><input type="hidden" name="tags" value={draftTags} />
    <input type="hidden" name="links" value={JSON.stringify(links)} /><input type="hidden" name="messages" value={JSON.stringify(serializeFloors(floors))} />
    {state.error && <p className="forum-error" role="alert">{state.error}</p>}
    {error && <p className="forum-error" role="alert">{error}</p>}
    {state.saved && !dirty && !state.error && <p className="forum-success" role="status">草稿已保存。</p>}
    <fieldset className="forum-editor-lock" disabled={pending}>
      <header className="forum-writing-header">
        <p className="archive-label">校园论坛 · {live?.envelope?.status === "published" ? "已发布" : "草稿"}</p>
        <label className="sr-only" htmlFor="forum-writing-title">帖子标题</label><input ref={titleRef} data-shared-field="帖子标题" onCompositionStart={titleBinding.compositionStart} onCompositionEnd={titleBinding.compositionEnd} id="forum-writing-title" className="forum-writing-title" defaultValue={live ? draftTitle : undefined} value={live ? undefined : draftTitle} maxLength={160} onChange={event => live ? titleBinding.input(event.target.value) : setDraftTitle(event.target.value)} placeholder="给帖子起个标题……" />
        <div className="forum-writing-meta"><span>{forumBoards.find(item => item.id === draftBoard)?.label} · {floors.length} / 100 条发言</span><span>点击消息，继续这场讨论</span></div>
      </header>
      {live && <CollaborationPanel live={live} />}
      <ThreadTree prefix="draft" disabled={pending} nodes={floors.map((floor, index) => {
        const account = accounts.find(item => item.id === floor.forum_account_id);
        return { id: floor.id, parentId: floor.replyToId, floor: index + 1, body: floor.body, time: floor.in_world_time, name: account?.display_name ?? "校园路人", handle: account?.handle ?? "", avatarId: account?.avatar_asset_id, likes: floor.like_count, questions: floor.question_count };
      })} onMessage={id => { if (!pending) setSelectedId(id); }} />
      <section className="forum-composer" ref={bodyRef} aria-labelledby="forum-composer-title">
        <h2 id="forum-composer-title">{!floors.length ? "先写下楼主的第一条消息" : composer.beforeId ? "插入一条发言" : composer.replyToId ? "回复这条消息" : "接着说点什么"}</h2>
        {target && <div className="forum-compose-context"><span>{composer.beforeId ? "插入到" : "回复"}第 {targetNumber} 楼 · {accounts.find(account => account.id === target.forum_account_id)?.display_name}</span><p>{target.body.slice(0, 120)}</p><button type="button" onClick={() => context(null)}>取消{composer.beforeId ? "插入" : "引用"}</button></div>}
        <button type="button" className="forum-composer-speaker" aria-haspopup="dialog" onClick={() => setPickingSpeaker(true)}><Avatar key={speaker?.avatar_asset_id} assetId={speaker?.avatar_asset_id} name={speaker?.display_name ?? defaultName} /><strong>{speaker?.display_name ?? defaultName}</strong>{!floors.length && <b className="thread-owner">楼主</b>}<span>更换身份 / 头像</span></button>
        <FloorBodyEditor id="forum-compose-body" body={composer.body} disabled={pending || floors.length >= 100} onBusy={busy} onChange={body => { setComposer(current => ({ ...current, body })); setError(""); }} />
        {composer.body && <div className="forum-live-preview"><span>发言效果</span><ForumBody body={composer.body} /></div>}
        <div className="forum-composer-footer"><details><summary>发言时间（可选）</summary><label>戏内时间<input value={composer.time} maxLength={100} onChange={event => setComposer(current => ({ ...current, time: event.target.value }))} placeholder="例如：昨晚 22:30" /></label></details><button type="button" className="button button-primary" disabled={pending || !composer.body.trim() || floors.length >= 100} onClick={() => void send()}>{working ? "正在发言…" : !floors.length ? "发出首帖" : composer.beforeId ? "插入发言" : "发出消息"}</button></div>
        {floors.length >= 100 && <p className="forum-form-hint">已到 100 条发言上限，可以继续编辑已有楼层。</p>}
        <p className="forum-composer-notice" role="status">{notice}</p>
      </section>
      <details className="forum-writing-settings"><summary>帖子设置与导入</summary>
        <div className="forum-editor-meta"><label>版面<select value={draftBoard} onChange={event => setDraftBoard(event.target.value)}>{forumBoards.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label>标签<input ref={tagsRef} data-shared-field="帖子标签" onCompositionStart={tagsBinding.compositionStart} onCompositionEnd={tagsBinding.compositionEnd} defaultValue={live ? draftTags : undefined} value={live ? undefined : draftTags} onChange={event => live ? tagsBinding.input(event.target.value) : setDraftTags(event.target.value)} placeholder="逗号分隔，最多 8 个" /></label></div>
        <details className="forum-entity-picker"><summary>关联校园档案（{links.length}）</summary><p className="forum-form-hint">关联人物、学院、地点或事件，不会修改档案。</p><label>选择档案<select value={entityChoice} disabled={links.length >= 30} onChange={event => setEntityChoice(event.target.value)}><option value="">选择一个校园档案</option>{entities.filter(entity => !links.some(link => link.entity_id === entity.id && link.entity_type === entity.type)).map(entity => <option key={entity.type + ":" + entity.id} value={entity.type + ":" + entity.id}>{entity.label}</option>)}</select></label><button className="button button-secondary" type="button" disabled={!entityChoice || links.length >= 30} onClick={() => { const entity = entities.find(item => item.type + ":" + item.id === entityChoice); if (entity) { setLinks(current => [...current, { entity_type: entity.type, entity_id: entity.id }]); setEntityChoice(""); setDirty(true); } }}>添加关联</button><ul>{links.map(link => { const entity = entities.find(item => item.id === link.entity_id && item.type === link.entity_type); return <li key={link.entity_type + ":" + link.entity_id}><span>{entity?.label ?? "档案已不可用"}</span><button type="button" className="button button-secondary" onClick={() => { setLinks(current => current.filter(item => item !== link)); setDirty(true); }}>移除</button></li>; })}</ul></details>
        <MarkdownImport kind="forum" disabled={pending} onImport={async (data, raw) => {
          if (operationLock.current || uploadLock.current) throw new Error("请等待当前操作完成。");
          if (composer.body.trim()) throw new Error("输入框还有未发出的消息，请先发出或清空，再导入。");
          operationLock.current = true; setWorking(true);
          try {
            const result = await prepareForumImportAccounts(raw);
            if (result.error) throw new Error(result.error);
            const ids = data.floors.map(() => crypto.randomUUID());
            const imported = data.floors.map((floor, index) => {
              const account = result.accounts.find(item => item.handle === floor.handle);
              if (!account) throw new Error("论坛身份匹配失败，请重新导入。");
              return { id: live && index === 0 && floors[0] ? floors[0].id : ids[index], forum_account_id: account.id, body: floor.body, in_world_time: floor.in_world_time, like_count: floor.like_count, question_count: floor.question_count, replyToId: floor.reply_to_floor_no ? (live && floor.reply_to_floor_no === 1 && floors[0] ? floors[0].id : ids[floor.reply_to_floor_no - 1]) : null };
            });
            setAccounts(result.accounts); setFloors(imported); setDraftTitle(data.title); setDraftBoard(data.board); setDraftTags(data.tags.join(", ")); setComposer(emptyComposer(crypto.randomUUID())); setDirty(true); setNotice("导入完成，请检查帖子后保存。"); setError("");
          } finally { operationLock.current = false; setWorking(false); }
        }} />
      </details>
      <div className="forum-form-actions"><Link className="text-link" href="/create/forum">我的帖子</Link><span className="forum-form-hint">{dirty ? live ? "改写正在同步" : "有未保存的修改" : ""}</span><button className="button button-secondary" type="submit" name="intent" value="save" disabled={pending}>{live?.envelope?.status === "published" ? "立即同步" : "保存草稿"}</button>{(!live || live.envelope?.status === "draft" && live.envelope.ownerId === live.envelope.viewerId) && <button className="button button-primary" type="submit" name="intent" value="publish" disabled={pending || !floors.length}>发布主题</button>}</div>
      <p className="forum-form-hint">{live ? "改写会自动同步。已发布作品的有效修改将实时公开；未发出的新回复仍留在输入框中。" : "发言先加入当前草稿，保存后再离开。作者发布后仍可进入编辑。"}</p>
      <GuideLink section="forum">查看论坛创作说明</GuideLink>
    </fieldset>
    {selected && <FloorActionDialog key={selected.id} floor={selected} number={floors.indexOf(selected) + 1} affectedReplies={floors.filter(floor => floor.replyToId === selected.id).length} topicId={topicId} accounts={accounts} locked={pending} onBusy={busy} sharedText={live ? floorText(live.doc, selected.id) : undefined} viewerId={live?.envelope?.viewerId} onClose={() => setSelectedId(null)} onAccount={rememberAccount} onUpdate={patch => patchFloor(selected.id, patch)} onReply={() => context(selected.id)} onInsert={() => { if (floors[0]?.id !== selected.id) context(null, selected.id); }} onOwner={() => { if (floors[0]) patchFloor(selected.id, { forum_account_id: floors[0].forum_account_id }); }} onRemove={() => {
      if (floors[0]?.id === selected.id) return;
      const affected = floors.filter(floor => floor.replyToId === selected.id).length;
      setFloors(current => removeFloor(current, selected.id)); setSelectedId(null); setDirty(true);
      if (composer.replyToId === selected.id || composer.beforeId === selected.id) setComposer(current => ({ ...current, replyToId: null, beforeId: undefined }));
      setNotice(affected ? "已删除，有 " + affected + " 条回复取消了对该楼的引用，正文保留。" : "发言已删除，楼层已重新编号。");
      focusComposer();
    }} />}
    {pickingSpeaker && <AuthorDialog title="选择发言身份" locked={pending} onClose={() => setPickingSpeaker(false)}><SpeakerPicker topicId={topicId} accounts={accounts} selectedId={composer.accountId} defaultName={defaultName} viewerId={live?.envelope?.viewerId} onBusy={busy} onAccount={rememberAccount} onChoose={id => { setComposer(current => ({ ...current, accountId: id })); setPickingSpeaker(false); }} /></AuthorDialog>}
  </form>;
}
