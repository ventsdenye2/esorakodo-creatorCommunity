"use client";
import { useEffect, useRef, useState } from "react";
import { parseForumBody } from "./body";

export type ExportFloor = { name: string; body: string; floor: number; likes: number; replyFloor: number | null; time: string };
const width = 900, padding = 48, maxHeight = 7800;

export async function renderThreadImages(title: string, floors: ExportFloor[]): Promise<Blob[]> {
  await document.fonts.ready;
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = maxHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("当前浏览器不支持生成图片。");
  const blobs: Blob[] = []; let y = padding;
  function clear() { ctx!.fillStyle = "#fbfdff"; ctx!.fillRect(0, 0, width, maxHeight); y = padding; }
  async function finish() {
    const page = document.createElement("canvas"); page.width = width; page.height = Math.ceil(y + padding);
    page.getContext("2d")!.drawImage(canvas, 0, 0);
    const blob = await new Promise<Blob | null>(resolve => page.toBlob(resolve, "image/png"));
    page.width = 0; page.height = 0;
    if (!blob) throw new Error("图片过大，生成失败，请稍后重试。"); blobs.push(blob); clear();
  }
  async function space(height: number) { if (y + height + padding > maxHeight) await finish(); y += height; }
  async function text(value: string, size = 28, color = "#102d46", bold = false) {
    const font = `${bold ? "600 " : ""}${size}px 'Microsoft YaHei','PingFang SC',sans-serif`;
    ctx!.font = font;
    for (const paragraph of value.split(/\r?\n/)) {
      let line = "";
      const push = async () => { const height = size * 1.65; if (y + height + padding > maxHeight) await finish(); ctx!.font = font; ctx!.fillStyle = color; ctx!.textBaseline = "top"; ctx!.fillText(line, padding, y + 6); y += height; line = ""; };
      for (const char of Array.from(paragraph)) {
        if (line && ctx!.measureText(line + char).width > width - padding * 2) await push();
        line += char;
      }
      await push();
    }
  }
  clear();
  try {
  await text("空天大学 · 校园论坛", 21, "#4f6a80"); await space(16); await text(title, 38, "#102d46", true); await space(28);
  for (const floor of floors) {
    await space(22); ctx.fillStyle = "#cadce7"; ctx.fillRect(padding, y - 12, width - padding * 2, 1);
    await text(`${floor.name}${floor.floor === 1 ? " · 楼主" : ""}`, 28, "#123b5a", true);
    await text(`${floor.floor} 楼${floor.time ? ` · ${floor.time}` : ""} · 赞 ${floor.likes}`, 20, "#4f6a80");
    if (floor.replyFloor) await text(`回复 ${floor.replyFloor} 楼`, 22, "#1f6697");
    const body = parseForumBody(floor.body);
    await space(10); if (body.text) await text(body.text);
    for (const media of body.images) {
      const response = await fetch(`${media.url}?export=1`, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`第 ${floor.floor} 楼的图片读取失败，请稍后重试。`);
      const bitmap = await createImageBitmap(await response.blob());
      try {
      const scale = Math.min((width - padding * 2) / bitmap.width, (maxHeight - padding * 2 - 40) / bitmap.height, 1);
      const w = bitmap.width * scale, h = bitmap.height * scale;
      if (y + h + 20 + padding > maxHeight) await finish();
      ctx.drawImage(bitmap, padding, y + 10, w, h); y += h + 20;
      } finally { bitmap.close(); }
    }
    await space(20);
  }
  await text("— 完 —", 22, "#4f6a80"); await finish();
  return blobs;
  } finally { canvas.width = 0; canvas.height = 0; }
}

export function ThreadExport({ title, floors }: { title: string; floors: ExportFloor[] }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [urls, setUrls] = useState<string[]>([]);
  const resources = useRef<string[]>([]);
  useEffect(() => () => resources.current.forEach(URL.revokeObjectURL), []);
  async function generate() {
    if (busy) return; setBusy(true); setError("");
    resources.current.forEach(URL.revokeObjectURL); resources.current = []; setUrls([]);
    try {
      const blobs = await renderThreadImages(title, floors);
      resources.current = blobs.map(blob => URL.createObjectURL(blob)); setUrls(resources.current);
      if (resources.current.length === 1) { const a = document.createElement("a"); a.href = resources.current[0]; a.download = `${title.replace(/[<>:"/\\|?*]/g, "_").slice(0, 80)}.png`; a.click(); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "长图生成失败，请重试。"); }
    finally { setBusy(false); }
  }
  return <div className="forum-export"><button type="button" className="button button-secondary" disabled={busy} onClick={() => void generate()}>{busy ? "正在生成长图…" : "↓ 一键成图"}</button><a className="forum-comments-jump" href="#reader-comments">查看读者评论 ↓</a>
    <span role="status">{urls.length > 1 ? `内容较长，已按阅读顺序生成 ${urls.length} 张长图。` : urls.length ? "长图已生成，可下载或打开后保存。" : "导出正文和故事楼层"}</span>
    {urls.map((url, i) => <a key={url} href={url} download={`${title.replace(/[<>:"/\\|?*]/g, "_").slice(0, 80)}-${i + 1}.png`}>下载长图 {i + 1}</a>)}
    {urls.map((url, i) => <a key={`open-${url}`} href={url} target="_blank" rel="noreferrer">打开图片 {i + 1}</a>)}
    {error && <p role="alert" className="forum-error">{error}</p>}
  </div>;
}
