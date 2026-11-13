"use client";
import { useEffect, useRef } from "react";

export function ThreadLikes({ count, onIncrease, disabled = false }: { count: number; onIncrease?: (amount: number) => void; disabled?: boolean }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);
  const active = useRef(false);
  const increase = useRef(onIncrease);
  useEffect(() => { increase.current = onIncrease; }, [onIncrease]);
  function stop() {
    active.current = false;
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }
  useEffect(() => {
    const cancel = () => { held.current = true; stop(); };
    window.addEventListener("blur", cancel);
    document.addEventListener("visibilitychange", cancel);
    return () => { stop(); window.removeEventListener("blur", cancel); document.removeEventListener("visibilitychange", cancel); };
  }, []);
  useEffect(() => { if (disabled || !onIncrease || count >= 999999999) stop(); }, [disabled, onIncrease, count]);
  const content = <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 10v11H3V10h4Zm0 0 5-7c2 0 3 1 2 4l-1 3h6a2 2 0 0 1 2 2l-2 7a3 3 0 0 1-3 2H7" /></svg><span>{count ? count.toLocaleString("zh-CN") : "赞"}</span></>;
  if (!onIncrease) return <span className="thread-likes" aria-label={"赞同 " + count.toLocaleString("zh-CN")} title="剧情中的赞同数">{content}</span>;
  return <button type="button" className="thread-likes thread-likes-edit" disabled={disabled || count >= 999999999}
    aria-label={"增加赞同，当前 " + count.toLocaleString("zh-CN")} title="单击加 1，长按加速增加"
    onPointerDown={event => {
      if (event.button !== 0 || !event.isPrimary) return;
      stop(); held.current = false; active.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      const started = performance.now();
      const tick = () => {
        if (!active.current) return;
        held.current = true;
        const elapsed = performance.now() - started;
        increase.current?.(elapsed >= 6000 ? 20 : elapsed >= 3500 ? 5 : 1);
        timer.current = setTimeout(tick, elapsed >= 3500 ? 60 : elapsed >= 1500 ? 100 : 200);
      };
      timer.current = setTimeout(tick, 450);
    }}
    onPointerUp={stop} onPointerCancel={() => { held.current = true; stop(); }} onLostPointerCapture={stop}
    onBlur={() => { held.current = true; stop(); }} onContextMenu={event => event.preventDefault()}
    onClick={event => { event.stopPropagation(); if (!held.current || event.detail === 0) onIncrease(1); held.current = false; }}
  >{content}</button>;
}
