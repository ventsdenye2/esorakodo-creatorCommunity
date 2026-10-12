"use client";
/* eslint-disable @next/next/no-img-element -- Authenticated media uses expiring redirects. */
import { useRef, useState } from "react";
import { parseForumBody } from "./body";
export function ForumBody({ body, quoted = false }: { body: string; quoted?: boolean }) {
  const { text, images } = parseForumBody(body);
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<{url: string; alt: string} | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  return <div className={quoted ? "thread-quote-body" : "thread-body-content"}>
    {text && <p className="thread-body">{text}</p>}
    {images.length > 0 && <div className={quoted ? "thread-images thread-images-quoted" : "thread-images"}>{images.map((image, index) => <button key={index} type="button" aria-label={"查看完整图片：" + (image.alt || "图片 " + (index + 1))} onClick={event => { trigger.current = event.currentTarget; setActive(image); dialog.current?.showModal(); }}><img src={image.url} alt={image.alt || "图片 " + (index + 1)} loading="lazy" /></button>)}</div>}
    <dialog ref={dialog} className="thread-image-dialog" onClose={() => trigger.current?.focus()}>
      <button type="button" onClick={() => dialog.current?.close()}>关闭图片</button>
      {active && <><img src={active.url} alt={active.alt || "完整图片"} /><a href={active.url} target="_blank" rel="noreferrer">打开原图 ↗</a></>}
    </dialog>
  </div>;
}
