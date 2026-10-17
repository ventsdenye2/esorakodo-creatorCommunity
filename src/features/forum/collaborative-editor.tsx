"use client";
import type { ComponentProps } from "react";
import { DraftEditor } from "./draft-editor";
import { useForumCollaboration } from "./use-forum-collaboration";

export function CollaborativeForumEditor(props: ComponentProps<typeof DraftEditor>) {
  const live = useForumCollaboration(props.topicId);
  if (!live.value || !live.envelope) return <section className="forum-editor-connecting" aria-live="polite"><h2>{live.error ? "暂时无法进入编辑" : "正在打开你的帖子…"}</h2><p>{live.error || "正在读取最新改写和在线成员。"}</p>{live.error && <button type="button" className="button button-secondary" onClick={live.reconnect}>重新连接</button>}</section>;
  return <DraftEditor {...props} live={live} />;
}
