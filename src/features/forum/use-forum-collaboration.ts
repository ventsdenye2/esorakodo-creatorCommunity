"use client";
import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import type { ForumAccount } from "../../types/database";
import type { EditEnvelope } from "./collaboration-server";
import { readForum, REMOTE, type SharedForum } from "./collaboration-document";

export function encodeUpdate(bytes: Uint8Array) {
  let binary = ""; for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return btoa(binary);
}
export function decodeUpdate(value: string) { return Uint8Array.from(atob(value), char => char.charCodeAt(0)); }

export function useForumCollaboration(topicId: string) {
  const [doc] = useState(() => new Y.Doc());
  const [value, setValue] = useState<SharedForum | null>(null);
  const [envelope, setEnvelope] = useState<EditEnvelope | null>(null);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [revoked, setRevoked] = useState(false);
  const [retry, setRetry] = useState(0);
  const current = useRef<EditEnvelope | null>(null), queued = useRef<Uint8Array[]>([]), sending = useRef(false), gone = useRef(false);
  const flushRef = useRef<(publish?: boolean) => Promise<boolean>>(async () => false);
  const accessLost = useRef(false);
  const session = useRef(""), field = useRef(""), cacheKey = useRef("");

  useEffect(() => {
    gone.current = false; accessLost.current = false; session.current = crypto.randomUUID();
    let events: EventSource | undefined, timer: ReturnType<typeof setTimeout> | undefined, heartbeat: ReturnType<typeof setInterval> | undefined;
    let composing = false, deferred: EditEnvelope | null = null, ready = false;
    const abort = new AbortController();
    async function request(body?: unknown): Promise<EditEnvelope> {
      const response = await fetch(`/api/forum/${topicId}/edit`, { method: body ? "POST" : "GET", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined, cache: "no-store", signal: abort.signal });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) { accessLost.current = true; setRevoked(true); events?.close(); }
        throw new Error(data.error ?? "同步失败，请重试。");
      }
      return data as EditEnvelope;
    }
    function receive(data: EditEnvelope) {
      if (gone.current) return;
      if (composing) { if (!deferred || data.document.revision >= deferred.document.revision) deferred = data; return; }
      if (current.current && data.document.revision < current.current.document.revision) return;
      Y.applyUpdate(doc, decodeUpdate(data.document.state), REMOTE);
      current.current = data; setEnvelope(data); setValue(readForum(doc));
    }
    function keepBackup() {
      try { if (cacheKey.current) localStorage.setItem(cacheKey.current, encodeUpdate(Y.encodeStateAsUpdate(doc))); }
      catch { setError("浏览器备份空间不足，请下载当前改写后继续。"); }
    }
    async function flush(publish = false) {
      if (publish && sending.current) { while (sending.current && !gone.current) await new Promise(resolve => setTimeout(resolve, 40)); }
      if (!ready || sending.current || accessLost.current || gone.current || composing) return false;
      const batch = queued.current.splice(0);
      if (!batch.length && !publish) return true;
      sending.current = true;
      try {
        const update = batch.length ? Y.mergeUpdates(batch) : Y.encodeStateAsUpdate(doc);
        const data = await request({ kind: "update", update: encodeUpdate(update), publish });
        receive(data); setError("");
        if (!queued.current.length) { setDirty(false); if (cacheKey.current) localStorage.removeItem(cacheKey.current); }
        return true;
      } catch (cause) {
        queued.current.unshift(...batch); setError(cause instanceof Error ? cause.message : "连接中断，修改保留在本机，重新连接后继续同步。"); keepBackup();
        return false;
      } finally {
        sending.current = false;
        if (queued.current.length && !gone.current) timer = setTimeout(() => void flush(), 1200);
      }
    }
    flushRef.current = flush;
    function changed(update: Uint8Array, origin: unknown) {
      if (origin === REMOTE || !ready) return;
      queued.current.push(update); setValue(readForum(doc)); setDirty(true); keepBackup();
      clearTimeout(timer); timer = setTimeout(() => void flush(), 250);
    }
    async function presence(leave = false) {
      if (!ready || gone.current && !leave) return;
      try { await fetch(`/api/forum/${topicId}/edit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "presence", sessionId: session.current, field: field.current, leave }), keepalive: leave }); } catch { /* SSE status remains the connection indicator. */ }
    }
    const compositionStart = () => { composing = true; };
    const compositionEnd = () => { composing = false; queueMicrotask(() => { if (deferred) { const next = deferred; deferred = null; receive(next); } void flush(); }); };
    const focused = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || !target.closest(".forum-natural-editor")) return;
      field.current = target.dataset.sharedField ?? (target.closest(".forum-composer") ? "新回复" : "帖子设置"); void presence();
    };
    const beforeLeave = (event: BeforeUnloadEvent) => { if (queued.current.length || sending.current) event.preventDefault(); };
    document.addEventListener("compositionstart", compositionStart, true); document.addEventListener("compositionend", compositionEnd, true); document.addEventListener("focusin", focused);
    window.addEventListener("beforeunload", beforeLeave); doc.on("update", changed);
    void request().then(data => {
      if (gone.current) return;
      receive(data); cacheKey.current = `forum-edit:${topicId}:${data.viewerId}`; ready = true;
      const backup = localStorage.getItem(cacheKey.current);
      if (backup) { const vector = Y.encodeStateVector(doc); Y.applyUpdate(doc, decodeUpdate(backup), REMOTE); const restored = Y.encodeStateAsUpdate(doc, vector); if (restored.length > 2) { queued.current.push(restored); setValue(readForum(doc)); setDirty(true); void flush(); } }
      events = new EventSource(`/api/forum/${topicId}/stream?editing=1`);
      events.onopen = () => { setConnected(true); void flush(); };
      events.onmessage = event => { try { receive(JSON.parse(event.data)); } catch { setError("同步内容无法读取，请保留当前改写后重新连接。"); } };
      events.addEventListener("revoked", () => { accessLost.current = true; setRevoked(true); setConnected(false); setError("作者已移除你的协作权限，当前改写可下载保留。"); events?.close(); });
      events.onerror = () => { setConnected(false); if (!gone.current) void request().then(receive).catch(cause => { if (!gone.current) setError(cause instanceof Error ? cause.message : "正在重新连接…"); }); };
      void presence(); heartbeat = setInterval(() => void presence(), 15000);
    }).catch(cause => { if (!gone.current) setError(cause instanceof Error ? cause.message : "协作服务暂不可用。"); });
    return () => { gone.current = true; void presence(true); events?.close(); clearTimeout(timer); clearInterval(heartbeat); abort.abort(); doc.off("update", changed); document.removeEventListener("compositionstart", compositionStart, true); document.removeEventListener("compositionend", compositionEnd, true); document.removeEventListener("focusin", focused); window.removeEventListener("beforeunload", beforeLeave); };
  }, [topicId, doc, retry]);

  async function manage(handle?: string, removeId?: string) {
    const response = await fetch(`/api/forum/${topicId}/edit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "member", handle, removeId }) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "协作者设置未保存。");
    current.current = data; setEnvelope(data);
  }
  function accounts(next: ForumAccount[] | ((before: ForumAccount[]) => ForumAccount[])) { setEnvelope(before => before ? { ...before, accounts: typeof next === "function" ? next(before.accounts) : next } : before); }
  function download() {
    const blob = new Blob([JSON.stringify({ work: value, update: encodeUpdate(Y.encodeStateAsUpdate(doc)) }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob), link = document.createElement("a"); link.href = url; link.download = `forum-${topicId}-改写备份.json`; link.click(); URL.revokeObjectURL(url);
  }
  return { doc, value, envelope, error, connected, dirty, revoked, accounts, manage, download, flush: (publish = false) => flushRef.current(publish), reconnect: () => { setRevoked(false); setRetry(value => value + 1); } };
}
export type ForumSession = ReturnType<typeof useForumCollaboration>;
