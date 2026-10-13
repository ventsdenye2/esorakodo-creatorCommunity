"use client";

import { createContext, startTransition, useActionState, useRef, useState, type ReactNode } from "react";

export const UploadBusyContext = createContext<((busy: boolean) => void) | null>(null);

// Dispatch manually so a returned validation error does not reset native inputs.
export function ActionForm({ action, children, className }: {
  action: (previous: { error: string | null }, form: FormData) => Promise<{ error: string | null }>;
  children: ReactNode; className: string;
}) {
  const [state, dispatch, pending] = useActionState(action, { error: null });
  const [uploading, setUploading] = useState(false);
  const uploadBusy = useRef(false);
  function uploadStatus(busy: boolean) { uploadBusy.current = busy; setUploading(busy); }
  return <UploadBusyContext.Provider value={uploadStatus}><form action={dispatch} className={className} aria-busy={pending || uploading} onSubmit={event => {
    event.preventDefault();
    if (pending || uploadBusy.current) return;
    const form = new FormData(event.currentTarget);
    startTransition(() => dispatch(form));
  }}>
    {state.error && <p className="auth-notice auth-notice-error" role="alert">{state.error}</p>}
    {pending && <p role="status">正在保存…</p>}
    {uploading && <p role="status">图片正在上传，请完成后保存。</p>}
    <div inert={pending || uploading} style={{ display: "contents" }}>{children}</div>
  </form></UploadBusyContext.Provider>;
}
