"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "../../components/ui/avatar";
import { ForumBody } from "./body-view";
export type ThreadNode = {
  id: string; parentId: string | null; floor: number; body: string; time: string;
  name: string; handle: string; isDefault?: boolean; avatarId?: string | null; likes: number; questions: number;
};
export function ThreadTree({ nodes, renderEditor, onReply, onMessage, disabled = false, prefix = "floor" }: {
  nodes: ThreadNode[]; renderEditor?: (node: ThreadNode) => ReactNode;
  onReply?: (id: string) => void; onMessage?: (id: string) => void; disabled?: boolean; prefix?: string;
}) {
  const ordered = [...nodes].sort((a, b) => a.floor - b.floor);
  const owner = ordered[0]?.handle;
  // Pointer access anywhere in a message duplicates its explicit keyboard-accessible action button.
  /* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
  return <div className={"thread-tree" + (onMessage ? " thread-authoring" : "")} onClick={onMessage ? event => {
    if (disabled || !(event.target instanceof Element) || event.target.closest("a,button,input,textarea,select,dialog") || window.getSelection()?.toString()) return;
    const message = event.target.closest<HTMLElement>("[data-message-id]");
    if (message?.dataset.messageId) onMessage(message.dataset.messageId);
  } : undefined}><ol className="thread-branch">{ordered.map(node => {
    const parent = ordered.find(item => item.id === node.parentId && item.floor < node.floor);
    return <li key={node.id} className="thread-node" id={prefix + "-" + node.id} tabIndex={-1}>
      <article className="thread-message" data-message-id={node.id}>
        <header className="thread-identity"><Avatar key={node.avatarId} assetId={node.avatarId} name={node.name} />
          <div className="thread-author-name">{renderEditor || onMessage || node.isDefault ? <strong>{node.name}</strong> : <Link href={"/forum/accounts/" + node.handle}>{node.name}</Link>}{owner && node.handle === owner && (!node.isDefault || node.id === ordered[0]?.id) && <b className="thread-owner">楼主</b>}</div>
          <span className="thread-likes" aria-label={"赞同 " + node.likes.toLocaleString("zh-CN")} title="剧情中的赞同数"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 10v11H3V10h4Zm0 0 5-7c2 0 3 1 2 4l-1 3h6a2 2 0 0 1 2 2l-2 7a3 3 0 0 1-3 2H7" /></svg><span>{node.likes ? node.likes.toLocaleString("zh-CN") : "赞"}</span></span>{onMessage && <button type="button" className="thread-message-action" aria-label={`操作第 ${node.floor} 楼`} aria-haspopup="dialog" disabled={disabled} onClick={() => onMessage(node.id)}>···</button>}
        </header>
        {parent && <blockquote className="thread-quote"><a className="thread-parent" href={"#" + prefix + "-" + parent.id} onClick={() => document.getElementById(prefix + "-" + parent.id)?.focus()}>{parent.floor}楼 · {parent.name}</a><ForumBody body={parent.body} quoted /></blockquote>}
        {renderEditor ? renderEditor(node) : <ForumBody body={node.body} />}
        <div className="thread-post-meta">{node.time && <time>{node.time}</time>}<span>{node.floor}楼</span></div>
        {onReply && <div className="thread-controls"><button type="button" onClick={() => onReply(node.id)}>↳ 添加回复</button></div>}
      </article>
    </li>;
  })}</ol></div>;
}
