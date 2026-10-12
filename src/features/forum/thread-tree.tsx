"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "../../components/ui/avatar";
import { ForumBody } from "./body-view";
export type ThreadNode = {
  id: string; parentId: string | null; floor: number; body: string; time: string;
  name: string; handle: string; avatarId?: string | null; likes: number; questions: number;
};
export function ThreadTree({ nodes, renderEditor, onReply, prefix = "floor" }: {
  nodes: ThreadNode[]; renderEditor?: (node: ThreadNode) => ReactNode;
  onReply?: (id: string) => void; prefix?: string;
}) {
  const ordered = [...nodes].sort((a, b) => a.floor - b.floor);
  const owner = ordered[0]?.handle;
  return <div className="thread-tree"><ol className="thread-branch">{ordered.map(node => {
    const parent = ordered.find(item => item.id === node.parentId && item.floor < node.floor);
    return <li key={node.id} className="thread-node" id={prefix + "-" + node.id} tabIndex={-1}>
      <article className="thread-message">
        <header className="thread-identity"><Avatar assetId={node.avatarId} name={node.name} />
          <div>{renderEditor ? <strong>{node.name}</strong> : <Link href={"/forum/accounts/" + node.handle}>{node.name}</Link>}<span>@{node.handle || "未选择身份"}</span>{owner && node.handle === owner && <b className="thread-owner">楼主</b>}</div>
          {node.time && <time>{node.time}</time>}<span className="thread-floor">{node.floor}楼</span>
        </header>
        {parent && <blockquote className="thread-quote"><a className="thread-parent" href={"#" + prefix + "-" + parent.id} onClick={() => document.getElementById(prefix + "-" + parent.id)?.focus()}>{parent.floor}楼 · {parent.name}</a><ForumBody body={parent.body} quoted /></blockquote>}
        {renderEditor ? renderEditor(node) : <><ForumBody body={node.body} /><div className="thread-reactions" aria-label="剧情中的反应数量"><span title="赞同这条内容">👍 <b>{node.likes.toLocaleString("zh-CN")}</b></span><span title="感到抽象或不理解"><b className="question-icon">?</b> <b>{node.questions.toLocaleString("zh-CN")}</b></span></div></>}
        {onReply && <div className="thread-controls"><button type="button" onClick={() => onReply(node.id)}>↳ 添加回复</button></div>}
      </article>
    </li>;
  })}</ol></div>;
}
