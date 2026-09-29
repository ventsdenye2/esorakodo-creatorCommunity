"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Avatar } from "../../components/ui/avatar";

export type ThreadNode = {
  id: string; parentId: string | null; floor: number; body: string; time: string;
  name: string; handle: string; avatarId?: string | null; likes: number; questions: number;
};

export function ThreadTree({ nodes, renderEditor, onReply, prefix = "floor" }: {
  nodes: ThreadNode[]; renderEditor?: (node: ThreadNode) => ReactNode;
  onReply?: (id: string) => void; prefix?: string;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const children = (id: string | null) => nodes.filter(node => node.parentId === id);
  function reveal(id: string) {
    setCollapsed(current => {
      const next = new Set(current);
      let node = nodes.find(item => item.id === id);
      const seen = new Set<string>();
      while (node && !seen.has(node.id)) { seen.add(node.id); next.delete(node.id); node = nodes.find(item => item.id === node?.parentId); }
      return next;
    });
    requestAnimationFrame(() => document.getElementById(`${prefix}-${id}`)?.focus());
  }
  function branch(parentId: string | null, depth: number): ReactNode {
    return <ol className={`thread-branch${depth > 0 ? " thread-branch-nested" : ""}`}>
      {children(parentId).map(node => {
        const replies = children(node.id);
        const closed = collapsed.has(node.id);
        const parent = nodes.find(item => item.id === node.parentId);
        return <li key={node.id} className="thread-node" id={`${prefix}-${node.id}`} tabIndex={-1}>
          <article className="thread-message">
            <header className="thread-identity">
              <Avatar assetId={node.avatarId} name={node.name} />
              <div>{renderEditor ? <strong>{node.name}</strong> : <Link href={`/forum/accounts/${node.handle}`}>{node.name}</Link>}<span>@{node.handle || "未选择身份"}</span></div>
              {node.time && <time>{node.time}</time>}<span className="thread-floor">#{String(node.floor).padStart(2, "0")}</span>
            </header>
            {parent && <a className="thread-parent" href={`#${prefix}-${parent.id}`} onClick={() => reveal(parent.id)}>回复 #{String(parent.floor).padStart(2, "0")} · {parent.name}</a>}
            {renderEditor ? renderEditor(node) : <><p className="thread-body">{node.body}</p><div className="thread-reactions" aria-label="剧情中的反应数量"><span title="赞同这条内容">👍 <b>{node.likes.toLocaleString("zh-CN")}</b></span><span title="感到抽象或不理解"><b className="question-icon">?</b> <b>{node.questions.toLocaleString("zh-CN")}</b></span></div></>}
            <div className="thread-controls">
              {replies.length > 0 && <button type="button" aria-expanded={!closed} aria-controls={`${prefix}-replies-${node.id}`} onClick={() => setCollapsed(current => { const next = new Set(current); if (closed) next.delete(node.id); else next.add(node.id); return next; })}>{closed ? "⊕" : "⊖"} {closed ? "展开" : "收起"} {replies.length} 条直接回复</button>}
              {onReply && <button type="button" onClick={() => { reveal(node.id); onReply(node.id); }}>↳ 添加回复</button>}
            </div>
          </article>
          {replies.length > 0 && <div id={`${prefix}-replies-${node.id}`} hidden={closed} className={depth >= 3 ? "thread-depth-limit" : undefined}>{branch(node.id, depth + 1)}</div>}
        </li>;
      })}
    </ol>;
  }
  return <div className="thread-tree" onInvalidCapture={event => {
    const input = event.target as HTMLInputElement;
    setCollapsed(new Set());
    requestAnimationFrame(() => input.focus());
  }}>{branch(null, 0)}</div>;
}
