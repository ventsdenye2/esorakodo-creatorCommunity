"use client";
import Image from "next/image";


import Link from "next/link";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { uploadImage } from "../media/image-upload";
import { createCharacter } from "./actions";
import { imageFile, normalizePortrait, renderStudentCard } from "./card-renderer";
import { DEFAULT_PORTRAIT, DRAFT_KEY, draftSchema, newDraft, studentNumber, type AbilityExample, type Appearance, type CharacterDraft } from "./model";

const FaceMaker = lazy(() => import("./face-maker").then(module => ({ default: module.FaceMaker })));
type College = { id: string; name: string; summary: string | null };
type Props = { colleges: College[]; examples: AbilityExample[]; creatorId: string | null; sourceFailed?: boolean; configured: boolean };
const steps = ["学院", "留影", "能力", "记忆点", "名字"];
const questions = ["", "如果 ta 来到了空天大学，你觉得，ta 会属于哪所学院？", "ta 的学生证照片，会是什么样子呢？", "如果 ta 生活在空天大学里，ta 会有什么特殊的能力呢？", "ta 身上，有哪些独特的记忆点呢？", "最后，ta 的名字是……？"];

function AbilityReel({ examples }: { examples: AbilityExample[] }) {
  const [index, setIndex] = useState(0), [paused, setPaused] = useState(false);
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    if (paused || examples.length < 2) return;
    const timer = window.setInterval(() => { if (!document.hidden && !reduced.matches) setIndex(value => (value + 1) % examples.length); }, 6000);
    return () => clearInterval(timer);
  }, [examples.length, paused]);
  if (!examples.length) return <p className="character-hint">可以是一种天赋，也可以是很小的本领。还没想好，就把这个问题留给未来。</p>;
  const example = examples[index % examples.length];
  return <section className="ability-reel" aria-label="校园档案中的能力片段" onFocus={event => { if (event.target instanceof HTMLAnchorElement) setPaused(true); }}>
    <div className="ability-reel-heading"><span>从校园档案里，拾取一点灵感</span><button type="button" onClick={() => setPaused(value => !value)} aria-pressed={paused}>{paused ? "播放" : "暂停"}</button></div>
    <blockquote key={index}><p>{example.text}</p><cite><Link href={`/wiki/student/${example.slug}`} target="_blank" rel="noreferrer">{example.name}的档案 ↗</Link></cite></blockquote>
    <div className="ability-reel-controls"><span>{String(index + 1).padStart(2, "0")} / {String(examples.length).padStart(2, "0")}</span><button type="button" onClick={() => { setPaused(true); setIndex(value => (value + 1) % examples.length); }}>看下一个片段 →</button></div>
  </section>;
}

function CardPreview({ draft, college }: { draft: CharacterDraft; college: string }) {
  return <aside className="character-preview" aria-label="角色档案实时预览">
    <div className="character-preview-caption"><span>空天大学 · 入学留影</span><span>STUDENT RECORD</span></div>
    <div className="character-portrait-mount"><Image unoptimized src={draft.portrait} width={720} height={960} alt="角色当前的证件照" /><span aria-hidden="true">K / U</span></div>
    <div className="character-preview-name"><span>姓名 / NAME</span><strong>{draft.name.trim() || "未命名同学"}</strong></div>
    <dl><div><dt>所属学院</dt><dd>{college || "尚待选择"}</dd></div><div><dt>特殊能力</dt><dd>{draft.ability.trim() || "尚待发现"}</dd></div><div><dt>记忆点</dt><dd>{draft.traits.trim() || "留给未来的故事"}</dd></div></dl>
    <div className="character-preview-foot"><span>{studentNumber(draft.requestId)}</span><span>正在成为 ta</span></div>
  </aside>;
}

function FinalCard({ card, draft, creatorId, configured, onClose, onSave, busy, error }: { card: string; draft: CharacterDraft; creatorId: string | null; configured: boolean; onClose: () => void; onSave: () => void; busy: boolean; error: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className="character-final-dialog" aria-labelledby="card-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <p className="archive-label">A NEW STORY BEGINS</p><h2 id="card-title">你好，{draft.name.trim() || "未命名同学"}。</h2><p>一张学生证，一段尚未开始的校园故事。</p>
    <Image unoptimized className="character-finished-card" src={card} width={1016} height={638} alt={`${draft.name.trim() || "未命名同学"}的空天大学学生证`} />
    <p className="character-hint">确认后会建立公开的角色档案，之后仍可编辑。跳过的内容可以慢慢补上。</p>
    {error ? <p className="auth-notice auth-notice-error" role="alert">{error}</p> : null}
    <div className="character-final-actions"><a className="button button-secondary" href={card} download={`${draft.name.trim().replace(/[\\/:*?"<>|]/g, "_") || "未命名同学"}_学生证.png`}>下载学生证</a>{creatorId ? <button type="button" className="button button-primary" disabled={busy || !configured} onClick={onSave}>{busy ? "正在建立档案…" : "建立角色档案"}</button> : <Link className="button button-primary" href="/login?next=%2Fcreate%2Fcharacter">登录并建立档案</Link>}</div>
    {!configured ? <p role="status">档案服务暂不可用，仍可下载并保留当前输入。</p> : null}
    {creatorId && error ? <Link href="/login?next=%2Fcreate%2Fcharacter">重新登录后返回重试</Link> : null}
    <button type="button" className="character-text-button" disabled={busy} onClick={onClose}>返回，再改一改</button>
  </dialog>;
}

function RestartDialog({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className="character-final-dialog character-reset-dialog" aria-labelledby="restart-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <p className="archive-label">ANOTHER CHARACTER</p><h2 id="restart-title">开始一个新角色？</h2><p>这会清除当前浏览器里暂存的回答与形象。已经建立的角色档案会保留。</p>
    <div className="character-final-actions"><button type="button" className="button button-secondary" onClick={onClose}>继续当前角色</button><button type="button" className="button button-primary" onClick={onConfirm}>开始新角色</button></div>
  </dialog>;
}

export function CharacterCreator({ colleges, examples, creatorId, sourceFailed, configured }: Props) {
  const [draft, setDraft] = useState<CharacterDraft | null>(null), [faceOpen, setFaceOpen] = useState(false);
  const [restartOpen, setRestartOpen] = useState(false);
  const [card, setCard] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false), [storageNote, setStorageNote] = useState("");
  const heading = useRef<HTMLHeadingElement>(null), nextButton = useRef<HTMLButtonElement>(null), faceButton = useRef<HTMLButtonElement>(null);
  const restartButton = useRef<HTMLButtonElement>(null);
  const uploads = useRef<{ portrait?: { src: string; id: string }; card?: { src: string; id: string } }>({});
  useEffect(() => {
    let restored: CharacterDraft | null = null;
    try { const raw = localStorage.getItem(DRAFT_KEY); if (raw) { const parsed = draftSchema.safeParse(JSON.parse(raw)); if (parsed.success) restored = parsed.data; } } catch { /* A blocked or old draft must not prevent creation. */ }
    const value = restored ?? newDraft();
    queueMicrotask(() => setDraft(value));
  }, []);
  useEffect(() => {
    if (!draft) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { queueMicrotask(() => setStorageNote("当前浏览器无法暂存，离开页面前请先下载学生证。")); }
  }, [draft]);
  const closeFace = useCallback(() => { setFaceOpen(false); requestAnimationFrame(() => faceButton.current?.focus()); }, []);
  const applyFace = useCallback((portrait: string, appearance: Appearance) => { setDraft(value => value ? { ...value, portrait, appearance } : value); setFaceOpen(false); requestAnimationFrame(() => faceButton.current?.focus()); }, []);
  if (!draft) return <div className="character-loading" role="status">正在翻开角色档案…</div>;
  const collegeName = colleges.find(college => college.id === draft.collegeId)?.name ?? "";
  function change(patch: Partial<CharacterDraft>) { setDraft(value => value ? { ...value, ...patch } : value); setError(""); }
  function go(step: number) { change({ step }); requestAnimationFrame(() => heading.current?.focus()); }
  async function finish() {
    if (!draft) return;
    setBusy(true); setError("");
    try { setCard(await renderStudentCard(draft)); } catch (err) { setError(err instanceof Error ? err.message : "学生证生成失败，请重试。"); } finally { setBusy(false); }
  }
  async function save() {
    if (!draft || busy) return;
    setBusy(true); setError("");
    try {
      if (uploads.current.portrait?.src !== draft.portrait) {
        const asset = await uploadImage(await imageFile(draft.portrait, "角色证件照.png")); uploads.current.portrait = { src: draft.portrait, id: asset.id };
      }
      if (uploads.current.card?.src !== card) {
        const asset = await uploadImage(await imageFile(card, "角色学生证.png")); uploads.current.card = { src: card, id: asset.id };
      }
      const result = await createCharacter({ requestId: draft.requestId, name: draft.name, collegeId: draft.collegeId, ability: draft.ability, traits: draft.traits, appearance: draft.appearance, portraitAssetId: uploads.current.portrait.id, cardAssetId: uploads.current.card.id });
      if (result.error || !result.href) throw new Error(result.error || "无法确认保存结果，请重试。");
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* The archive has been saved. */ }
      window.location.assign(`${result.href}?message=${encodeURIComponent("角色档案已建立，可以继续补充 ta 的故事。")}`);
    } catch (err) { setError(err instanceof Error ? err.message : "建立档案失败，请重试。"); } finally { setBusy(false); }
  }
  return <div className="character-creator">
    <nav className="character-breadcrumb" aria-label="面包屑"><Link href="/">Campus</Link><span>/</span><span>角色创建</span></nav>
    <div className="character-workspace">
      <div className="character-question-column">
        <div className="character-edition"><span>空天大学 · 角色创建</span><span>CHARACTER / ADMISSIONS</span><button ref={restartButton} type="button" className="character-text-button" disabled={busy} onClick={() => setRestartOpen(true)}>重新开始</button></div>
        <ol className="character-progress" aria-label="创建进度">{steps.map((name, index) => <li key={name} aria-current={draft.step === index + 1 ? "step" : undefined} data-reached={draft.step >= index + 1}><button type="button" disabled={busy || draft.step === 0 || index + 1 > draft.step} onClick={() => go(index + 1)}><span>{String(index + 1).padStart(2, "0")}</span>{name}</button></li>)}</ol>
        <section key={draft.step} className="character-question-sheet" aria-labelledby="character-question">
          <p className="character-question-index">{draft.step ? `QUESTION ${String(draft.step).padStart(2, "0")} / 05` : "WELCOME TO KONGTIAN"}</p>
          <h1 ref={heading} tabIndex={-1} id="character-question">{draft.step ? questions[draft.step] : <>让一个新角色，<br /><em>走进空天大学。</em></>}</h1>
          {draft.step === 0 ? <><p className="character-intro">现在，跟随引导，一起来创建你的角色吧～</p><p className="character-hint">五个小问题，慢慢认识 ta。<br />每一题都可以跳过，灵感不必一次到齐。</p><button type="button" className="button button-primary character-start" onClick={() => go(1)}>开始创建 <span aria-hidden="true">→</span></button><p className="character-small-print">已有角色也可以再创作。完成后，你会得到一张学生证和一份角色档案。</p></> : null}
          {draft.step === 1 ? <><p className="character-hint">跟着直觉选一所，也可以暂时不决定。</p>{sourceFailed ? <p role="status" className="character-source-note">校园资料暂时未能完整载入，可以跳过，稍后在档案里补充。</p> : null}<div className="character-colleges" aria-label="选择所属学院">{colleges.map((college, index) => <button type="button" key={college.id} className="character-college" aria-pressed={draft.collegeId === college.id} onClick={() => change({ collegeId: draft.collegeId === college.id ? null : college.id })}><span>{String(index + 1).padStart(2, "0")}</span><strong>{college.name}</strong><span aria-hidden="true">{draft.collegeId === college.id ? "✓" : "↗"}</span></button>)}</div>{!colleges.length && !sourceFailed ? <p className="character-hint">学院档案还在整理，可以先跳过。</p> : null}</> : null}
          {draft.step === 2 ? <><p className="character-hint">默认形象已经准备好了。你也可以换一张，只属于 ta 的入学留影。</p><div className="character-photo-choice"><Image unoptimized src={draft.portrait} width={720} height={960} alt="当前选择的角色形象" /><div><span className="archive-label">MAKE IT YOURS</span><button ref={faceButton} type="button" className="button button-primary" onClick={() => setFaceOpen(true)}>捏一个形象</button><label className="character-upload">上传自己的图片<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={async event => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; setBusy(true); setError(""); try { change({ portrait: await normalizePortrait(file), appearance: null }); } catch (err) { setError(err instanceof Error ? err.message : "照片读取失败。"); } finally { setBusy(false); } }} /></label><small>PNG / JPEG / WebP · 10MB以内<br />照片会居中裁为 3:4。</small>{draft.portrait !== DEFAULT_PORTRAIT ? <button type="button" className="character-text-button" onClick={() => change({ portrait: DEFAULT_PORTRAIT, appearance: null })}>恢复默认形象</button> : null}</div></div></> : null}
          {draft.step === 3 ? <><AbilityReel examples={examples} /><label className="character-answer"><span>属于 ta 的能力 <small>可留空</small></span><textarea value={draft.ability} maxLength={2000} rows={4} onChange={event => change({ ability: event.target.value })} placeholder="也许能听见风里的声音，也许总能记住每一条路……" /></label></> : null}
          {draft.step === 4 ? <><p className="character-hint">一个习惯、一件随身物、一段往事……任何让你想到 ta 的细节都可以。</p><label className="character-answer"><span>写下你最先想到的 <small>可留空</small></span><textarea value={draft.traits} maxLength={4000} rows={7} onChange={event => change({ traits: event.target.value })} placeholder="ta 总在口袋里放着一张折起的星图。" /></label></> : null}
          {draft.step === 5 ? <><p className="character-hint">轻轻念出这个名字。还没想好，就先叫 ta“未命名同学”吧。</p><label className="character-answer character-name-answer"><span>ta 的名字 <small>可留空 · 最多32字</small></span><input autoComplete="off" maxLength={32} value={draft.name} onChange={event => change({ name: event.target.value })} placeholder="未命名同学" /></label><p className="character-name-note">{collegeName ? `${collegeName}，` : "空天大学，"}即将迎来一位新同学。</p></> : null}
        </section>
        {error && !card ? <p role="alert" className="auth-notice auth-notice-error">{error}</p> : null}
        {draft.step > 0 ? <div className="character-navigation"><button type="button" disabled={busy} className="character-text-button" onClick={() => go(draft.step - 1)}>← 上一步</button><div><button type="button" className="character-text-button character-skip" disabled={busy} onClick={() => draft.step === 5 ? void finish() : go(draft.step + 1)}>跳过此题</button><button ref={nextButton} type="button" className="button button-primary" disabled={busy} onClick={() => draft.step === 5 ? void finish() : go(draft.step + 1)}>{busy ? "正在准备…" : draft.step === 5 ? "领取学生证" : "下一题"}<span aria-hidden="true">→</span></button></div></div> : null}
        <p className="character-save-note" role="status">{storageNote || "输入仅暂存于这台浏览器，确认建立档案后才会公开。"}</p>
      </div>
      <CardPreview draft={draft} college={collegeName} />
    </div>
    {faceOpen ? <Suspense fallback={<p role="status">正在打开形象制作室…</p>}><FaceMaker appearance={draft.appearance} onApply={applyFace} onClose={closeFace} /></Suspense> : null}
    {card ? <FinalCard card={card} draft={draft} creatorId={creatorId} configured={configured} busy={busy} error={error} onSave={() => void save()} onClose={() => { setCard(""); setError(""); requestAnimationFrame(() => nextButton.current?.focus()); }} /> : null}
    {restartOpen ? <RestartDialog onClose={() => { setRestartOpen(false); requestAnimationFrame(() => restartButton.current?.focus()); }} onConfirm={() => { setDraft(newDraft()); uploads.current = {}; setCard(""); setError(""); setRestartOpen(false); requestAnimationFrame(() => heading.current?.focus()); }} /> : null}
  </div>;
}
