"use client";

import { useRef, useState } from "react";
import { Avatar } from "../../components/ui/avatar";
import { ImageUpload } from "../media/image-upload";
import type { ForumAccount } from "../../types/database";
import { groupForumAccounts, isLegacyGeneratedAccount } from "../forum-accounts/account-groups";
import { getDefaultDraftSpeaker, saveDraftSpeaker } from "./speaker-actions";

export function SpeakerPicker({ topicId, accounts, selectedId, defaultName, onChoose, onAccount, onBusy, viewerId }: {
  topicId: string; accounts: ForumAccount[]; selectedId: string | null; defaultName: string;
  onChoose: (id: string) => void; onAccount: (account: ForumAccount) => void; onBusy: (busy: boolean) => void;
  viewerId?: string;
}) {
  const selected = accounts.find(account => account.id === selectedId);
  const [choice, setChoice] = useState(selected?.is_default ? "" : selectedId ?? "");
  const [name, setName] = useState(selected?.display_name ?? defaultName);
  const [avatarId, setAvatarId] = useState<string | null>(selected?.avatar_asset_id ?? null);
  const [showLegacy, setShowLegacy] = useState(Boolean(selected && isLegacyGeneratedAccount(selected)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const groups = groupForumAccounts(accounts);
  const isDefault = choice === "", isNew = choice === "new";
  const owned = !viewerId || isNew || accounts.find(account => account.id === choice)?.created_by === viewerId;
  const lock = useRef(false);
  function setLocked(value: boolean) { lock.current = value; setBusy(value); onBusy(value); }
  function choose(id: string) {
    const account = accounts.find(item => item.id === id);
    setChoice(id); setName(account?.display_name ?? (id === "new" ? "" : defaultName)); setAvatarId(account?.avatar_asset_id ?? null); setError("");
  }
  async function confirm() {
    if (lock.current) return;
    if (!isDefault && (!name.trim() || name.trim().length > 60)) { setError("昵称请填写 1–60 字。"); return; }
    const account = accounts.find(item => item.id === choice);
    if (account && name.trim() === account.display_name && avatarId === account.avatar_asset_id) { onChoose(account.id); return; }
    setLocked(true); setError("");
    try {
      const result = isDefault ? await getDefaultDraftSpeaker(topicId) : await saveDraftSpeaker({ topicId, id: isNew ? null : choice, name, avatarId });
      if (result.error || !result.account) { setError(result.error ?? "身份保存失败，请重试。"); return; }
      onAccount(result.account); onChoose(result.account.id);
    } catch { setError("连接中断，请重试。当前身份设置仍保留。"); }
    finally { setLocked(false); }
  }
  return <div className="forum-speaker-picker">
    <label>发言身份<select aria-label="发言身份" data-dialog-focus value={choice} disabled={busy} onChange={event => choose(event.target.value)}>
      <option value="">momo · 默认路人（跨帖复用）</option>
      {!!groups.characters.length && <optgroup label="角色身份">{groups.characters.map(account => <option key={account.id} value={account.id}>{account.display_name} (@{account.handle})</option>)}</optgroup>}
      {showLegacy && !!groups.legacy.length && <optgroup label="历史自动路人">{groups.legacy.map(account => <option key={account.id} value={account.id}>{account.display_name} (@{account.handle})</option>)}</optgroup>}
      <option value="new">＋ 新建角色身份</option>
    </select></label>
    {!!groups.legacy.length && <label className="forum-legacy-toggle"><input type="checkbox" checked={showLegacy} disabled={busy} onChange={event => { setShowLegacy(event.target.checked); if (!event.target.checked && groups.legacy.some(a => a.id === choice)) choose(""); }} />显示历史自动路人（{groups.legacy.length}）</label>}
    <div className="forum-speaker-preview"><Avatar key={avatarId} assetId={avatarId} name={name || defaultName} /><span>{name || (isNew ? "新角色" : defaultName)}</span></div>
    {isDefault ? <p className="forum-form-hint">所有默认路人发言复用你的同一个 momo，不会每层新建身份，也不占用个人主页的角色列表。需要独立昵称或头像时，请选择“新建角色身份”。</p> : <>
      <label>昵称<input value={name} maxLength={60} placeholder="给这个角色起个名字" disabled={busy || !owned} onChange={event => setName(event.target.value)} /></label>
      {owned ? <details><summary>更换头像</summary><ImageUpload disabled={busy} onBusy={setLocked} onUploaded={asset => setAvatarId(asset.id)} />{avatarId && <button type="button" className="button button-secondary" disabled={busy} onClick={() => setAvatarId(null)}>使用默认头像</button>}</details> : <p className="forum-form-hint">这个身份可在作品中使用，昵称和头像由创建它的创作者管理。</p>}
      {!isNew && <p className="forum-form-hint">修改昵称和头像会同步到这个身份的其他发言。只想换一个人说话时，请选择其他角色或新建身份。</p>}
    </>}
    {error && <p className="forum-error" role="alert">{error}</p>}
    <button type="button" className="button button-primary" disabled={busy} onClick={() => void confirm()}>{busy ? "正在保存身份…" : isDefault ? "使用 momo" : "使用这个身份"}</button>
  </div>;
}
