"use client";

import { useRef, useState } from "react";
import { Avatar } from "../../components/ui/avatar";
import { ImageUpload } from "../media/image-upload";
import type { ForumAccount } from "../../types/database";
import { saveDraftSpeaker } from "./speaker-actions";

export function SpeakerPicker({ topicId, accounts, selectedId, defaultName, onChoose, onAccount, onBusy, viewerId }: {
  topicId: string; accounts: ForumAccount[]; selectedId: string | null; defaultName: string;
  onChoose: (id: string) => void; onAccount: (account: ForumAccount) => void; onBusy: (busy: boolean) => void;
  viewerId?: string;
}) {
  const selected = accounts.find(account => account.id === selectedId);
  const [choice, setChoice] = useState(selectedId ?? "");
  const [name, setName] = useState(selected?.display_name ?? defaultName);
  const [avatarId, setAvatarId] = useState<string | null>(selected?.avatar_asset_id ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const owned = !viewerId || !choice || accounts.find(account => account.id === choice)?.created_by === viewerId;
  const lock = useRef(false);
  function setLocked(value: boolean) { lock.current = value; setBusy(value); onBusy(value); }
  function choose(id: string) {
    const account = accounts.find(item => item.id === id);
    setChoice(id); setName(account?.display_name ?? defaultName); setAvatarId(account?.avatar_asset_id ?? null); setError("");
  }
  async function confirm() {
    if (lock.current) return;
    if (!name.trim() || name.trim().length > 60) { setError("昵称请填写 1–60 字。"); return; }
    const account = accounts.find(item => item.id === choice);
    if (account && name.trim() === account.display_name && avatarId === account.avatar_asset_id) { onChoose(account.id); return; }
    setLocked(true); setError("");
    try {
      const result = await saveDraftSpeaker({ topicId, id: choice || null, name, avatarId });
      if (result.error || !result.account) { setError(result.error ?? "身份保存失败，请重试。"); return; }
      onAccount(result.account); onChoose(result.account.id);
    } catch { setError("连接中断，请重试。当前身份设置仍保留。"); }
    finally { setLocked(false); }
  }
  return <div className="forum-speaker-picker">
    <label>发言身份<select data-dialog-focus value={choice} disabled={busy} onChange={event => choose(event.target.value)}><option value="">自动生成一个新身份</option>{accounts.map(account => <option key={account.id} value={account.id}>{account.display_name} (@{account.handle})</option>)}</select></label>
    <div className="forum-speaker-preview"><Avatar key={avatarId} assetId={avatarId} name={name || defaultName} /><span>{name || defaultName}</span></div>
    <label>昵称<input value={name} maxLength={60} disabled={busy || !owned} onChange={event => setName(event.target.value)} /></label>
    {owned ? <details><summary>更换头像</summary><ImageUpload disabled={busy} onBusy={setLocked} onUploaded={asset => setAvatarId(asset.id)} />{avatarId && <button type="button" className="button button-secondary" disabled={busy} onClick={() => setAvatarId(null)}>使用默认头像</button>}</details> : <p className="forum-form-hint">这个身份可在作品中使用，昵称和头像由创建它的创作者管理。你也可以选择新身份。</p>}
    {choice && <p className="forum-form-hint">昵称和头像属于这个论坛身份，修改后会同步到它的其他发言。只想换一个人说话时，可以选择其他身份或新身份。</p>}
    {error && <p className="forum-error" role="alert">{error}</p>}
    <button type="button" className="button button-primary" disabled={busy} onClick={() => void confirm()}>{busy ? "正在保存身份…" : "使用这个身份"}</button>
  </div>;
}
