"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function AuthorDialog({ title, locked, onClose, children }: { title: string; locked: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    return () => { dialog?.close(); if (trigger?.isConnected) trigger.focus(); };
  }, []);
  useEffect(() => { ref.current?.querySelector<HTMLElement>("[data-dialog-focus]")?.focus(); }, [title]);
  return <dialog ref={ref} className="forum-author-dialog" aria-labelledby="forum-dialog-title" onCancel={event => { event.preventDefault(); if (!locked) onClose(); }} onKeyDown={event => {
    if (event.key !== "Tab") return;
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled):not([type="hidden"]), textarea:not(:disabled), select:not(:disabled), a[href], summary, [tabindex="0"]')).filter(control => control.getClientRects().length > 0);
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }}>
    <header><h2 id="forum-dialog-title">{title}</h2><button type="button" className="forum-dialog-close" aria-label="关闭弹窗" disabled={locked} onClick={onClose}>×</button></header>
    {children}
  </dialog>;
}
