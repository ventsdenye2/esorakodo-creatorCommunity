"use client";

import { useEffect, useRef, useState } from "react";
import { appearanceSchema, type Appearance } from "./model";

export function FaceMaker({ appearance, onApply, onClose }: { appearance: Appearance | null; onApply: (portrait: string, appearance: Appearance) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null), frame = useRef<HTMLIFrameElement>(null);
  const request = useRef<string | null>(null);
  const [ready, setReady] = useState(false), [waiting, setWaiting] = useState(false), [error, setError] = useState("");
  useEffect(() => {
    const el = dialog.current; el?.showModal();
    let loaded = false;
    function receive(event: MessageEvent) {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === "character:ready") { loaded = true; setError(""); setReady(true); frame.current?.contentWindow?.postMessage({ type: "character:restore", appearance: appearance ?? { version: 1 } }, location.origin); }
      if (event.data?.type === "character:close") { el?.close(); onClose(); }
      if (event.data?.type !== "character:portrait" || !request.current || event.data.requestId !== request.current) return;
      request.current = null; setWaiting(false);
      const parsed = appearanceSchema.safeParse(event.data.appearance);
      if (!parsed.success || typeof event.data.portrait !== "string" || event.data.portrait.length > 2500000 || !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(event.data.portrait)) { setError("形象未能导出，请重试。"); return; }
      el?.close();
      onApply(event.data.portrait, parsed.data);
    }
    window.addEventListener("message", receive);
    const slow = window.setTimeout(() => { if (!loaded) setError("素材加载较慢，可以继续等待，或关闭后重新打开。"); }, 20000);
    return () => { window.removeEventListener("message", receive); clearTimeout(slow); el?.close(); };
  }, [appearance, onApply, onClose]);
  useEffect(() => {
    if (!waiting) return;
    const timer = window.setTimeout(() => { request.current = null; setWaiting(false); setError("导出超时，请重试。"); }, 10000);
    return () => clearTimeout(timer);
  }, [waiting]);
  return <dialog ref={dialog} className="character-face-dialog" aria-labelledby="face-title" onCancel={event => { event.preventDefault(); dialog.current?.close(); onClose(); }}>
    <header><div><span className="archive-label">PORTRAIT STUDIO</span><h2 id="face-title">捏一个喜欢的形象</h2></div><button type="button" className="button button-secondary" onClick={() => { dialog.current?.close(); onClose(); }}>返回题目</button></header>
    <iframe ref={frame} src="/character-maker/index.html" title="空天大学角色捏脸工具" />
    <footer><p role="status">{ready ? "原画部件可以随心组合，使用后还能再改。" : "正在准备原画素材…"}</p><button type="button" className="button button-primary" disabled={!ready || waiting} onClick={() => { setError(""); setWaiting(true); request.current = crypto.randomUUID(); frame.current?.contentWindow?.postMessage({ type: "character:export", requestId: request.current }, location.origin); }}>{waiting ? "正在取出证件照…" : "使用这个形象"}</button></footer>
    {error ? <p role="alert">{error}</p> : null}
  </dialog>;
}
