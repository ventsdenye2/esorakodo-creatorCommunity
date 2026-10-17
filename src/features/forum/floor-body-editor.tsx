"use client";
import { useRef, useState, useEffect } from "react";
import { uploadImage } from "../media/image-upload";
import { forumImageMarkdown } from "./body";
import type { Text } from "yjs";
import { useSharedInput } from "./use-shared-input";
export function FloorBodyEditor({ id, body, disabled, onChange, onBusy, sharedText, sharedField }: { id: string; body: string; disabled: boolean; onChange: (body: string) => void; onBusy: (busy: boolean) => void; sharedText?: Text; sharedField?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const binding = useSharedInput(ref, sharedText);
  const latest = useRef(body);
  useEffect(() => { latest.current = body; }, [body]);
  const uploading = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(files: File[]) {
    if (disabled || uploading.current || !files.length) return;
    uploading.current = true; setBusy(true); onBusy(true); setError("");
    try {
      for (const file of files) {
        const asset = await uploadImage(file);
        const insertion = "\n" + forumImageMarkdown(asset.id, file.name) + "\n";
        latest.current = sharedText?.toString() ?? latest.current;
        if (latest.current.length + insertion.length > 10000) throw new Error("正文超过 10,000 字，请缩短后重试。");
        if (sharedText) sharedText.doc?.transact(() => sharedText.insert(sharedText.length, insertion));
        latest.current += insertion; onChange(latest.current);
      }
    } catch (err) { setError(err instanceof Error ? err.message : "图片上传失败，请重试。"); }
    finally { uploading.current = false; setBusy(false); onBusy(false); requestAnimationFrame(() => ref.current?.focus()); }
  }
  return <div className="floor-body-editor">
    <label htmlFor={id} className="sr-only">楼层正文</label><textarea data-dialog-focus data-shared-field={sharedField} ref={ref} id={id} value={sharedText ? undefined : body} defaultValue={sharedText ? body : undefined} disabled={disabled || busy} required rows={3} maxLength={10000} onCompositionStart={binding.compositionStart} onCompositionEnd={binding.compositionEnd} onChange={event => { if (sharedText) binding.input(event.target.value); onChange(event.target.value); }} onPaste={event => { const images = Array.from(event.clipboardData.items).filter(item => item.kind === "file" && item.type.startsWith("image/")).map(item => item.getAsFile()).filter((file): file is File => file !== null); if (images.length) { event.preventDefault(); void upload(images); } }} placeholder="写下发言，也可以粘贴图片……" />
    <details className="forum-image-tools"><summary>添加图片</summary><label>选择图片<input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={disabled || busy} onChange={event => { const files = Array.from(event.target.files ?? []); event.target.value = ""; void upload(files); }} /></label><p className="forum-form-hint">支持多选或在正文粘贴图片，每张最多 10MB（JPEG / PNG / WebP）。删除对应图片行即可移除图片。</p></details>
    {busy && <p className="forum-form-hint" role="status">正在上传并校验图片…</p>}
    {error && <p className="forum-error" role="alert">{error} 已成功插入的图片保留。</p>}
  </div>;
}
